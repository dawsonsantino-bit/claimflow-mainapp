import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { JOB_STATUSES, HUMAN_STATUSES } from '@/components/job/JobConstants';
import { toast } from 'sonner';
import { NotificationService } from '@/components/services/NotificationService';
import { createAndSendStatusUpdate } from '@/components/services/StatusUpdateService';

// All statuses admins can move to
const ADMIN_ALLOWED_STATUSES = Object.values(JOB_STATUSES);

// Sales reps can only move the early workflow stages
const SALES_REP_ALLOWED_STATUSES = [
  JOB_STATUSES.LeadCreated,
  JOB_STATUSES.AssessmentDone,
  JOB_STATUSES.ContractSigned,
  JOB_STATUSES.InitialDocumentationComplete,
];

export default function JobStatusManager({ job, user }) {
  const [status, setStatus] = useState(job.current_status);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const isAdmin = user.business_role === 'CompanyAdmin' || user.business_role === 'LocationAdmin';
  const isSalesRep = user.business_role === 'SalesRep';

  // Admins see all statuses; SalesReps only see the early stages they're responsible for
  const allowedStatuses = isAdmin ? ADMIN_ALLOWED_STATUSES : isSalesRep ? SALES_REP_ALLOWED_STATUSES : [];

  const handleUpdate = async () => {
    if (status === job.current_status) return;
    
    setIsLoading(true);
    try {
      // 1. Create history record
      await base44.entities.JobStatusHistory.create({
        job_id: job.id,
        from_status: job.current_status,
        to_status: status,
        changed_by_user_id: user.id,
        changed_at: new Date().toISOString(),
        note: "Manual status update via Job Detail"
      });

      // 2. Update job
      await base44.entities.Job.update(job.id, {
        current_status: status
      });

      // Notify
      await NotificationService.notifyStatusChange(job, job.current_status, status, user);

      // Auto-generate Homeowner Update (Fire and forget)
      createAndSendStatusUpdate(job, status, user).then(() => {
          queryClient.invalidateQueries({ queryKey: ['jobUpdates', job.id] });
      });

      toast.success("Status updated successfully");
      
      // 3. Refresh
      await queryClient.invalidateQueries({ queryKey: ['job', job.id] });
      await queryClient.invalidateQueries({ queryKey: ['jobHistory', job.id] });
      
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  // Hide status manager if user has no allowed statuses to move to
  if (allowedStatuses.length === 0) return null;

  return (
    <Card className="border-blue-100 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600" />
            Update Job Status
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Select value={status} onValueChange={setStatus} disabled={isLoading}>
            <SelectTrigger className="w-[250px] bg-white">
                <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
                {allowedStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                        {HUMAN_STATUSES[s]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        
        <Button 
            onClick={handleUpdate} 
            disabled={isLoading || status === job.current_status}
            className="bg-blue-600 hover:bg-blue-700 text-white"
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Update Status
        </Button>
      </CardContent>
    </Card>
  );
}