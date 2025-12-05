import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { JOB_STATUSES } from '@/components/job/JobConstants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewJob() {
  const [user, setUser] = useState(null);
  const { register, handleSubmit, control, setError, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
      const init = async () => {
          const u = await base44.auth.me();
          setUser(u);
      };
      init();
  }, []);

  const onSubmit = async (data) => {
    if (!user) return;
    setIsLoading(true);
    setSubmitError(null);

    try {
      // Check for existing homeowner user
      let homeownerUserId = null;
      if (data.property_email) {
          try {
              const existingUsers = await base44.entities.User.list({ email: data.property_email });
              if (existingUsers && existingUsers.length > 0) {
                  homeownerUserId = existingUsers[0].id;
              }
          } catch (e) {
              console.error("Error checking for existing user", e);
              // Don't block creation if user check fails
          }
      }

      // Ensure defaults for required fields
      // CRITICAL: We must use the user's actual company_id. 
      // If user.company_id is missing, we are likely in a bad state, but we'll fallback to the user's ID as a temporary namespace if needed, 
      // or just fail if strict. For now, we try to be robust.
      
      const companyId = user.company_id;
      if (!companyId) {
        throw new Error("User has no company_id. Please contact support or update your profile.");
      }

      const payload = {
        ...data,
        company_id: companyId,
        location_id: user.location_id || "default_location", 
        sales_rep_user_id: user.business_role === 'SalesRep' ? user.id : null, 
        homeowner_user_id: homeownerUserId,
        current_status: JOB_STATUSES.LeadCreated,
        lead_created_at: new Date().toISOString(),
        created_by: user.email
      };

      console.log("Creating Job with payload:", payload);

      const createdJob = await base44.entities.Job.create(payload);
      
      if (!createdJob || !createdJob.id) {
          throw new Error("Job creation failed: Backend returned no valid Job ID. The job may not have been saved.");
      }

      // Log initial status history
      try {
        await base44.entities.JobStatusHistory.create({
            job_id: createdJob.id,
            from_status: null,
            to_status: JOB_STATUSES.LeadCreated,
            changed_by_user_id: user.id,
            changed_at: new Date().toISOString(),
            note: "Initial Lead Creation"
        });
      } catch (historyError) {
          console.error("Failed to create history log", historyError);
          // Continue anyway since job was created
      }

      window.location.href = createPageUrl(`JobDetail?id=${createdJob.id}`);
    } catch (error) {
      console.error("Failed to create job", error);
      setIsLoading(false);
      
      // Handle specific validation errors if available
      if (error.message && error.message.includes("validation")) {
        setSubmitError("Validation failed: " + error.message);
      } else {
        setSubmitError(error.message || "Failed to create job. Please check your inputs and try again.");
      }
    }
  };

  if (!user) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to={createPageUrl('Dashboard')} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Create New Job</h1>
        <p className="text-slate-500">Enter property and homeowner details to start a new claim.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>All fields marked with * are required.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {submitError && (
                <div className="p-4 rounded-md bg-red-50 text-red-700 flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{submitError}</span>
                </div>
            )}

            {/* Homeowner Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Homeowner Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input {...register("property_owner_name", { required: "Full Name is required" })} placeholder="e.g. John Doe" />
                        {errors.property_owner_name && <span className="text-xs text-red-500">{errors.property_owner_name.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input {...register("property_email")} type="email" placeholder="john@example.com" />
                        <p className="text-xs text-slate-400">Used for homeowner portal access.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Phone Number *</Label>
                        <Input {...register("property_phone", { required: "Phone Number is required" })} type="tel" placeholder="(555) 123-4567" />
                        {errors.property_phone && <span className="text-xs text-red-500">{errors.property_phone.message}</span>}
                    </div>
                </div>
            </div>

            {/* Property Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Property Information</h3>
                <div className="space-y-2">
                    <Label>Address Line 1 *</Label>
                    <Input {...register("property_address_line1", { required: "Address is required" })} placeholder="123 Main St" />
                    {errors.property_address_line1 && <span className="text-xs text-red-500">{errors.property_address_line1.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>City *</Label>
                        <Input {...register("property_city", { required: "City is required" })} />
                        {errors.property_city && <span className="text-xs text-red-500">{errors.property_city.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <Label>State *</Label>
                        <Input {...register("property_state", { required: "State is required" })} />
                        {errors.property_state && <span className="text-xs text-red-500">{errors.property_state.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <Label>Zip Code *</Label>
                        <Input {...register("property_zip", { required: "Zip Code is required" })} />
                        {errors.property_zip && <span className="text-xs text-red-500">{errors.property_zip.message}</span>}
                    </div>
                </div>
            </div>

            {/* Job Details */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Claim Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Loss Type *</Label>
                        <Controller
                            name="loss_type"
                            control={control}
                            rules={{ required: "Loss Type is required" }}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Fire">Fire</SelectItem>
                                        <SelectItem value="Smoke">Smoke</SelectItem>
                                        <SelectItem value="Fire and Smoke">Fire and Smoke</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.loss_type && <span className="text-xs text-red-500">{errors.loss_type.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <Label>Insurance Provider {user?.business_role === 'SalesRep' && '*'}</Label>
                        <Input 
                            {...register("insurance_provider", { 
                                validate: (value) => {
                                    if (user?.business_role === 'SalesRep' && !value?.trim()) {
                                        return "Insurance Provider is required.";
                                    }
                                    return true;
                                }
                            })} 
                            placeholder="e.g., State Farm" 
                        />
                        <p className="text-xs text-slate-400">Required for Sales Reps.</p>
                        {errors.insurance_provider && <span className="text-xs text-red-500">{errors.insurance_provider.message}</span>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Initial Notes</Label>
                    <Textarea {...register("assessment_notes")} placeholder="Any initial details about the loss..." />
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <Link to={createPageUrl('Dashboard')}>
                    <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Create Job
                </Button>
            </div>

            </form>
        </CardContent>
      </Card>
    </div>
  );
}