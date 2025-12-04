import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { USER_ROLES } from '@/components/job/JobConstants';

export default function AdminJobsDebug() {
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['all-jobs-debug'],
    queryFn: () => base44.entities.Job.list({}, '-created_date', 200), // No filters, list last 200
    enabled: !!user,
  });

  if (isUserLoading || isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  // Debug Mode: Allow all users to view this page for now
  // if (!user || (user.business_role !== USER_ROLES.CompanyAdmin && user.business_role !== USER_ROLES.LocationAdmin)) {
  //   return <div className="p-8 text-center text-red-600">Access Denied: Admins Only</div>;
  // }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">All Jobs (Debug)</h1>
            <p className="text-sm text-slate-500">Showing unfiltered list of all jobs in the database visible to this user.</p>
        </div>
        <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load jobs: {error.message}</span>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Property Owner</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company ID</TableHead>
                <TableHead>Location ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs && jobs.length > 0 ? (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs text-slate-500">{job.id}</TableCell>
                    <TableCell className="font-medium">{job.property_owner_name}</TableCell>
                    <TableCell>{job.property_email}</TableCell>
                    <TableCell className="text-xs text-slate-400">{job.company_id}</TableCell>
                    <TableCell className="text-xs text-slate-400">{job.location_id}</TableCell>
                    <TableCell>{job.current_status}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {job.created_date ? format(new Date(job.created_date), 'MMM d, yyyy HH:mm') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link 
                        to={createPageUrl(`JobDetail?id=${job.id}`)}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        View <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No jobs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}