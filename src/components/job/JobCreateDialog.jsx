import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { JOB_STATUSES } from '@/components/job/JobConstants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function JobCreateDialog({ open, onOpenChange, user }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const newJob = {
        ...data,
        company_id: user.company_id,
        location_id: user.location_id,
        sales_rep_user_id: user.id,
        current_status: JOB_STATUSES.LeadCreated,
        lead_created_at: new Date().toISOString(),
        created_by: user.email
      };

      const createdJob = await base44.entities.Job.create(newJob);
      
      // Log initial status history
      await base44.entities.JobStatusHistory.create({
        job_id: createdJob.id,
        to_status: JOB_STATUSES.LeadCreated,
        changed_by_user_id: user.id,
        changed_at: new Date().toISOString(),
        note: "Initial Lead Creation"
      });

      window.location.href = createPageUrl(`JobDetail?id=${createdJob.id}`);
    } catch (error) {
      console.error("Failed to create job", error);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Enter the property details to start a new claim workflow.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Property Owner Name</Label>
              <Input {...register("property_owner_name", { required: true })} placeholder="John Doe" />
              {errors.property_owner_name && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div className="space-y-2">
              <Label>Loss Type</Label>
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
            <Label>Address Line 1</Label>
            <Input {...register("property_address_line1", { required: true })} placeholder="123 Main St" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...register("property_city", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input {...register("property_state", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Zip</Label>
              <Input {...register("property_zip", { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("property_phone", { required: true })} type="tel" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register("property_email")} type="email" />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}