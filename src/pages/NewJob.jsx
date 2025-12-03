import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewJob() {
  const [user, setUser] = useState(null);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);

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
          }
      }

      const newJob = {
        ...data,
        company_id: user.company_id, // Assuming user has this, or we might need a selector for admins
        location_id: user.location_id, // Ditto
        sales_rep_user_id: user.business_role === 'SalesRep' ? user.id : null,
        homeowner_user_id: homeownerUserId,
        current_status: JOB_STATUSES.LeadCreated,
        lead_created_at: new Date().toISOString(),
        created_by: user.email
      };

      const createdJob = await base44.entities.Job.create(newJob);
      
      // Log initial status history
      await base44.entities.JobStatusHistory.create({
        job_id: createdJob.id,
        from_status: null,
        to_status: JOB_STATUSES.LeadCreated,
        changed_by_user_id: user.id,
        changed_at: new Date().toISOString(),
        note: "Initial Lead Creation"
      });

      window.location.href = createPageUrl(`JobDetail?id=${createdJob.id}`);
    } catch (error) {
      console.error("Failed to create job", error);
      setIsLoading(false);
      alert("Failed to create job. Please check your inputs and try again.");
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
            
            {/* Homeowner Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Homeowner Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input {...register("property_owner_name", { required: true })} placeholder="e.g. John Doe" />
                        {errors.property_owner_name && <span className="text-xs text-red-500">Required</span>}
                    </div>
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input {...register("property_email")} type="email" placeholder="john@example.com" />
                        <p className="text-xs text-slate-400">Used for homeowner portal access.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Phone Number *</Label>
                        <Input {...register("property_phone", { required: true })} type="tel" placeholder="(555) 123-4567" />
                        {errors.property_phone && <span className="text-xs text-red-500">Required</span>}
                    </div>
                </div>
            </div>

            {/* Property Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Property Information</h3>
                <div className="space-y-2">
                    <Label>Address Line 1 *</Label>
                    <Input {...register("property_address_line1", { required: true })} placeholder="123 Main St" />
                    {errors.property_address_line1 && <span className="text-xs text-red-500">Required</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>City *</Label>
                        <Input {...register("property_city", { required: true })} />
                        {errors.property_city && <span className="text-xs text-red-500">Required</span>}
                    </div>
                    <div className="space-y-2">
                        <Label>State *</Label>
                        <Input {...register("property_state", { required: true })} />
                        {errors.property_state && <span className="text-xs text-red-500">Required</span>}
                    </div>
                    <div className="space-y-2">
                        <Label>Zip Code *</Label>
                        <Input {...register("property_zip", { required: true })} />
                        {errors.property_zip && <span className="text-xs text-red-500">Required</span>}
                    </div>
                </div>
            </div>

            {/* Job Details */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Claim Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Loss Type *</Label>
                        <Select onValueChange={(val) => setValue("loss_type", val)} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Fire">Fire</SelectItem>
                                <SelectItem value="Smoke">Smoke</SelectItem>
                                <SelectItem value="Fire and Smoke">Fire and Smoke</SelectItem>
                            </SelectContent>
                        </Select>
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