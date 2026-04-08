import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { HUMAN_STATUSES } from '@/components/job/JobConstants';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ClosedJobsPanel({ user }) {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs-closed', user.company_id],
    queryFn: () => base44.entities.Job.filter({ company_id: user.company_id, is_closed: true }),
  });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  if (error) return (
    <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5" /><span>Failed to load closed jobs</span>
    </div>
  );

  if (!jobs || jobs.length === 0) return (
    <Card>
      <CardContent className="py-12 text-center text-slate-500">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="font-medium">No closed jobs yet.</p>
      </CardContent>
    </Card>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Closed Jobs ({jobs.length})
        </CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim #</TableHead>
              <TableHead>Property Owner</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Final Status</TableHead>
              <TableHead>Closed</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id} className="bg-slate-50/50">
                <TableCell className="font-mono text-xs text-slate-500">#{job.claim_number || '-'}</TableCell>
                <TableCell className="font-medium">{job.property_owner_name}</TableCell>
                <TableCell>{job.property_address_line1}, {job.property_city}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {HUMAN_STATUSES[job.current_status] || job.current_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-500">
                  {job.updated_date ? format(new Date(job.updated_date), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    to={createPageUrl(`JobDetail?id=${job.id}`)}
                    className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    View <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}