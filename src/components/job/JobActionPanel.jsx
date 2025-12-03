import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, ArrowRight, Upload, AlertTriangle } from 'lucide-react';
import { JOB_STATUSES, USER_ROLES } from '@/components/job/JobConstants';

export default function JobActionPanel({ job, user }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({});

  // --- ACTION HANDLERS ---

  const updateStatus = async (newStatus, updateData = {}, transitionNote = "") => {
    setIsLoading(true);
    try {
      // 1. Update Job
      const timestampField = getTimestampFieldForStatus(newStatus);
      const updatePayload = {
        current_status: newStatus,
        [timestampField]: new Date().toISOString(),
        ...updateData
      };
      
      await base44.entities.Job.update(job.id, updatePayload);

      // 2. Create History
      await base44.entities.JobStatusHistory.create({
        job_id: job.id,
        from_status: job.current_status,
        to_status: newStatus,
        changed_by_user_id: user.id,
        changed_at: new Date().toISOString(),
        note: transitionNote
      });

      // 3. Trigger AI Update (Async - fire and forget for UI responsiveness, 
      // but ideally we'd wait or use a backend function. We'll wait here to ensure it runs)
      await generateAIUpdate(job, job.current_status, newStatus);

      queryClient.invalidateQueries(['job', job.id]);
      setFormData({}); // Reset form
    } catch (error) {
      console.error("Transition failed", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTimestampFieldForStatus = (status) => {
     switch(status) {
         case JOB_STATUSES.AssessmentDone: return 'assessment_completed_at';
         case JOB_STATUSES.ContractSigned: return 'contract_signed_at';
         case JOB_STATUSES.InitialDocumentationComplete: return 'initial_docs_completed_at';
         case JOB_STATUSES.HygienistAssigned: return 'hygienist_assigned_at';
         case JOB_STATUSES.SwabCompletedLabSent: return 'lab_submitted_at'; // close enough
         case JOB_STATUSES.LabResultsProtocolReady: return 'protocol_uploaded_at';
         case JOB_STATUSES.InsuranceNegotiation: return 'insurance_negotiation_started_at';
         case JOB_STATUSES.InsurancePaidFirstCheck: return 'first_insurance_payment_received_at';
         case JOB_STATUSES.WorkInProgress: return 'work_started_at';
         case JOB_STATUSES.WorkCompleted: return 'work_completed_at';
         case JOB_STATUSES.FinalCheckToAttorney: return 'final_payment_to_attorney_at';
         case JOB_STATUSES.ContractorPaidCaseClosed: return 'closed_at'; // and contractor_paid_at
         default: return 'updated_at';
     }
  };

  const generateAIUpdate = async (jobData, fromStatus, toStatus) => {
    try {
      const prompt = `
        You are a helpful assistant for a home restoration company. 
        A job for customer ${jobData.property_owner_name} has moved from status "${fromStatus}" to "${toStatus}".
        
        Write a short, friendly, reassuring email update message for the homeowner explaining what this means in plain English.
        Do not use technical jargon. Be concise (2-3 sentences).
        
        Context:
        - Loss Type: ${jobData.loss_type}
        - Location: ${jobData.property_city}
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
            type: "object",
            properties: {
                subject: { type: "string" },
                message: { type: "string" }
            }
        }
      });

      if (result) {
          // Create JobUpdate entry
          await base44.entities.JobUpdate.create({
              job_id: jobData.id,
              title: result.subject,
              message: result.message,
              audience: "Homeowner",
              visible_to_homeowner: true,
              created_by_user_id: user.id,
              generated_by_ai: true
          });
          
          // Send email to homeowner
          if (jobData.property_email) {
              try {
                  await base44.integrations.Core.SendEmail({
                      to: jobData.property_email,
                      subject: result.subject,
                      body: result.message
                  });
              } catch (emailError) {
                  console.error("Failed to send email", emailError);
              }
          }
      }
    } catch (e) {
        console.error("AI generation failed", e);
    }
  };

  const handleFileUpload = async (file, fieldName) => {
      if (!file) return null;
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
  };


  // --- RENDER LOGIC BASED ON STATUS & ROLE ---

  const canAct = (roles) => {
      return roles.includes(user.business_role) || 
             user.business_role === USER_ROLES.CompanyAdmin || 
             user.business_role === USER_ROLES.LocationAdmin;
  };

  if (job.current_status === JOB_STATUSES.LeadCreated) {
      if (!canAct([USER_ROLES.SalesRep])) return null;
      return (
          <Card className="bg-blue-50 border-blue-200">
              <CardHeader><CardTitle>Next Step: Complete Assessment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <Label>Assessment Notes</Label>
                      <Textarea 
                          placeholder="Describe the damage observed..." 
                          value={formData.assessment_notes || ''}
                          onChange={e => setFormData({...formData, assessment_notes: e.target.value})}
                      />
                  </div>
                  <Button 
                      onClick={() => updateStatus(JOB_STATUSES.AssessmentDone, { assessment_notes: formData.assessment_notes })}
                      disabled={isLoading || !formData.assessment_notes}
                  >
                      {isLoading ? <Loader2 className="animate-spin" /> : "Mark Assessment Complete"}
                  </Button>
              </CardContent>
          </Card>
      );
  }

  if (job.current_status === JOB_STATUSES.AssessmentDone) {
      if (!canAct([USER_ROLES.SalesRep])) return null;
      return (
          <Card className="bg-blue-50 border-blue-200">
              <CardHeader><CardTitle>Next Step: Sign Contract</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>Method</Label>
                          <Select onValueChange={v => setFormData({...formData, contract_method: v})}>
                              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="DocuSign">DocuSign</SelectItem>
                                  <SelectItem value="PaperUpload">Paper Upload</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label>Contract File (Optional if DocuSign)</Label>
                          <Input type="file" onChange={async (e) => {
                              const url = await handleFileUpload(e.target.files[0]);
                              setFormData({...formData, contract_file_url: url});
                          }} />
                      </div>
                  </div>
                  <Button 
                      onClick={() => updateStatus(JOB_STATUSES.ContractSigned, { 
                          contract_method: formData.contract_method,
                          contract_file_url: formData.contract_file_url
                      })}
                      disabled={isLoading || !formData.contract_method}
                  >
                      Confirm Contract Signed
                  </Button>
              </CardContent>
          </Card>
      );
  }

  if (job.current_status === JOB_STATUSES.ContractSigned) {
      if (!canAct([USER_ROLES.SalesRep])) return null;
      return (
          <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                  <CardTitle>Next Step: Initial Documentation</CardTitle>
                  <CardDescription>Please upload at least 10 "Before" photos in the Photos tab before proceeding.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Button 
                      onClick={() => updateStatus(JOB_STATUSES.InitialDocumentationComplete)}
                      disabled={isLoading}
                  >
                      Confirm Documentation Complete
                  </Button>
              </CardContent>
          </Card>
      );
  }

  if (job.current_status === JOB_STATUSES.InitialDocumentationComplete) {
      if (!canAct([USER_ROLES.LocationAdmin, USER_ROLES.CompanyAdmin])) return null;
      // Admin assigns Hygienist here. Ideally we show a dropdown of hygienists.
      // For now, we'll assume they just click "Assign" and we might pick one or just prompt for ID in a real app.
      // Simplified: Just a text input for Hygienist User ID for MVP.
      return (
          <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader><CardTitle>Next Step: Assign Hygienist</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <Label>Hygienist User ID (or Email)</Label>
                      <Input 
                         placeholder="Enter Hygienist ID/Email" 
                         value={formData.hygienist_id || ''}
                         onChange={e => setFormData({...formData, hygienist_id: e.target.value})}
                      />
                      {/* In production this would be a combobox searching users */}
                  </div>
                  <Button 
                      onClick={() => updateStatus(JOB_STATUSES.HygienistAssigned, { hygienist_user_id: formData.hygienist_id })}
                      disabled={isLoading || !formData.hygienist_id}
                  >
                      Assign Hygienist
                  </Button>
              </CardContent>
          </Card>
      );
  }

  if (job.current_status === JOB_STATUSES.HygienistAssigned) {
      if (!canAct([USER_ROLES.Hygienist])) return null;
      return (
          <Card className="bg-blue-50 border-blue-200">
              <CardHeader><CardTitle>Next Step: Swab & Lab Submission</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>Lab Name</Label>
                          <Input onChange={e => setFormData({...formData, lab_name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <Label>Lab Case ID</Label>
                          <Input onChange={e => setFormData({...formData, lab_case_id: e.target.value})} />
                      </div>
                  </div>
                  <Button 
                      onClick={() => updateStatus(JOB_STATUSES.SwabCompletedLabSent, { 
                          lab_name: formData.lab_name, 
                          lab_case_id: formData.lab_case_id,
                          swab_taken_at: new Date().toISOString()
                      })}
                      disabled={isLoading || !formData.lab_name}
                  >
                      Confirm Swab Sent to Lab
                  </Button>
              </CardContent>
          </Card>
      );
  }

  if (job.current_status === JOB_STATUSES.SwabCompletedLabSent) {
      // Hygienist or Lab role uploads results
      if (!canAct([USER_ROLES.Hygienist])) return null;
      return (
          <Card className="bg-blue-50 border-blue-200">
              <CardHeader><CardTitle>Next Step: Upload Results & Protocol</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <Label>Result Status</Label>
                      <Select onValueChange={v => setFormData({...formData, lab_result_status: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Clear">Clear</SelectItem>
                              <SelectItem value="Contaminated">Contaminated</SelectItem>
                              <SelectItem value="Inconclusive">Inconclusive</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label>Lab Report PDF</Label>
                      <Input type="file" onChange={async e => {
                          const url = await handleFileUpload(e.target.files[0]);
                          setFormData({...formData, lab_report_file: url});
                      }} />
                  </div>
                  <Button 
                      onClick={() => updateStatus(JOB_STATUSES.LabResultsProtocolReady, {
                          lab_result_status: formData.lab_result_status,
                          lab_report_file: formData.lab_report_file
                      })}
                      disabled={isLoading || !formData.lab_result_status}
                  >
                      Results Ready
                  </Button>
              </CardContent>
          </Card>
      );
  }

  if (job.current_status === JOB_STATUSES.LabResultsProtocolReady) {
      if (!canAct([USER_ROLES.Attorney])) return null;
      return (
          <Card className="bg-purple-50 border-purple-200">
              <CardHeader><CardTitle>Next Step: Start Insurance Negotiation</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                      Review the protocol and lab results in the Photos/Docs tab. When ready to submit to insurance, click below.
                  </p>
                  <Button onClick={() => updateStatus(JOB_STATUSES.InsuranceNegotiation)}>
                      Start Negotiation
                  </Button>
              </CardContent>
          </Card>
      );
  }

  if (job.current_status === JOB_STATUSES.InsuranceNegotiation) {
      if (!canAct([USER_ROLES.Attorney])) return null;
      return (
          <Card className="bg-purple-50 border-purple-200">
              <CardHeader><CardTitle>Next Step: Confirm First Payment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                      Log negotiation details in the Negotiation tab. When the first check is received, proceed here.
                  </p>
                  <div className="space-y-2">
                      <Label>Approved Amount ($)</Label>
                      <Input 
                          type="number" 
                          placeholder="0.00" 
                          onChange={e => setFormData({...formData, insurance_approved_amount: e.target.value})}
                      />
                  </div>
                  <Button 
                      onClick={() => updateStatus(JOB_STATUSES.InsurancePaidFirstCheck, {
                          insurance_approved_amount: parseFloat(formData.insurance_approved_amount)
                      })}
                      disabled={isLoading || !formData.insurance_approved_amount}
                  >
                      Payment Received - Ready for Work
                  </Button>
              </CardContent>
          </Card>
      );
  }

  if (job.current_status === JOB_STATUSES.InsurancePaidFirstCheck) {
      // Admin or Contractor starts work
      if (!canAct([USER_ROLES.Contractor, USER_ROLES.CompanyAdmin])) return null;
      
      // If contractor not assigned, assign first
      if (!job.contractor_user_id && canAct([USER_ROLES.CompanyAdmin])) {
           return (
               <Card className="bg-yellow-50 border-yellow-200">
                   <CardHeader><CardTitle>Assign Contractor</CardTitle></CardHeader>
                   <CardContent className="space-y-4">
                       <Input 
                           placeholder="Contractor ID/Email"
                           onChange={e => setFormData({...formData, contractor_id: e.target.value})}
                       />
                       <Button 
                           onClick={() => base44.entities.Job.update(job.id, { contractor_user_id: formData.contractor_id }).then(() => queryClient.invalidateQueries(['job']))} 
                           disabled={!formData.contractor_id}
                        >
                           Assign Contractor
                       </Button>
                   </CardContent>
               </Card>
           );
      }

      return (
          <Card className="bg-orange-50 border-orange-200">
              <CardHeader><CardTitle>Next Step: Start Work</CardTitle></CardHeader>
              <CardContent>
                  <Button onClick={() => updateStatus(JOB_STATUSES.WorkInProgress)}>
                      Start Work
                  </Button>
              </CardContent>
          </Card>
      );
  }

  if (job.current_status === JOB_STATUSES.WorkInProgress) {
      if (!canAct([USER_ROLES.Contractor])) return null;
      return (
          <Card className="bg-orange-50 border-orange-200">
              <CardHeader>
                  <CardTitle>Next Step: Work Completed</CardTitle>
                  <CardDescription>Upload at least 2 "After" photos in the Photos tab.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Button onClick={() => updateStatus(JOB_STATUSES.WorkCompleted)}>
                      Mark Work Completed
                  </Button>
              </CardContent>
          </Card>
      );
  }

  if (job.current_status === JOB_STATUSES.WorkCompleted) {
      if (!canAct([USER_ROLES.Attorney])) return null;
      return (
          <Card className="bg-purple-50 border-purple-200">
              <CardHeader><CardTitle>Next Step: Final Check Received</CardTitle></CardHeader>
              <CardContent>
                  <Button onClick={() => updateStatus(JOB_STATUSES.FinalCheckToAttorney)}>
                      Final Settlement Received
                  </Button>
              </CardContent>
          </Card>
      );
  }

  if (job.current_status === JOB_STATUSES.FinalCheckToAttorney) {
      if (!canAct([USER_ROLES.Attorney, USER_ROLES.CompanyAdmin])) return null;
      return (
          <Card className="bg-green-50 border-green-200">
              <CardHeader><CardTitle>Next Step: Close Case</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <Label>Contractor Payable Amount ($)</Label>
                      <Input 
                          type="number"
                          onChange={e => setFormData({...formData, contractor_payable: e.target.value})}
                      />
                  </div>
                  <Button 
                      onClick={() => updateStatus(JOB_STATUSES.ContractorPaidCaseClosed, {
                          contractor_payable_amount: parseFloat(formData.contractor_payable),
                          contractor_paid_at: new Date().toISOString()
                      })}
                      disabled={isLoading || !formData.contractor_payable}
                  >
                      Distribute Funds & Close Case
                  </Button>
              </CardContent>
          </Card>
      );
  }

  return null;
}