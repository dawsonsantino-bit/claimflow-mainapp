import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { HUMAN_STATUSES } from '@/components/job/JobConstants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, ArrowRight, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ActiveJobsPanel({ user }) {
  const queryClient = useQueryClient();
  const [jobToClose, setJobToClose] = useState(null);
  const [closing, setClosing] = useState(false);

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs-active', user.company_id],
    queryFn: () => base44.entities.Job.filter({ company_id: user.company_id, is_closed: { $ne: true } }),
  });

  const handleClose = async () => {
    if (!jobToClose) return;
    setClosing(true);
    try {
      await base44.entities.Job.update(jobToClose.id, { is_closed: true });
      queryClient.invalidateQueries(['jobs-active', user.company_id]);
      queryClient.invalidateQueries(['jobs-closed', user.company_id]);
      toast.success(`Job for ${jobToClose.property_owner_name} has been closed.`);
    } catch {
      toast.error('Failed to close job.');
    } finally {
      setClosing(false);
      setJobToClose(null);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  if (error) return (
    <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5" /><span>Failed to load jobs</span>
    </div>
  );

  if (!jobs || jobs.length === 0) return (
    <Card>
      <CardContent className="py-12 text-center text-slate-500">
        <p className="font-medium">No active jobs found.</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Active Jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim #</TableHead>
                <TableHead>Property Owner</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs text-slate-500">#{job.claim_number || '-'}</TableCell>
                  <TableCell className="font-medium">{job.property_owner_name}</TableCell>
                  <TableCell>{job.property_address_line1}, {job.property_city}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50">
                      {HUMAN_STATUSES[job.current_status] || job.current_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {job.created_date ? format(new Date(job.created_date), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setJobToClose(job)}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Close Job
                      </Button>
                      <Link
                        to={createPageUrl(`JobDetail?id=${job.id}`)}
                        className="inline-flex items-center text-sm font-medium text-slate-900 hover:text-slate-700"
                      >
                        View <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!jobToClose} onOpenChange={(open) => !open && setJobToClose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the job for <strong>{jobToClose?.property_owner_name}</strong> as closed and move it to the Closed Jobs section. You can still view it afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              disabled={closing}
              className="bg-red-600 hover:bg-red-700"
            >
              {closing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Yes, Close Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}