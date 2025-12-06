import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { HUMAN_STATUSES } from '@/components/job/JobConstants';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function JobList({ title, queryFilter = {}, columns = [] }) {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs', JSON.stringify(queryFilter)],
    queryFn: () => base44.entities.Job.filter(queryFilter),
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>Failed to load jobs</span>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-sm">No jobs found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-xs text-slate-500">#{job.claim_number || '-'}</TableCell>
                <TableCell className="font-medium">{job.property_owner_name}</TableCell>
                <TableCell>
                  {job.property_address_line1}, {job.property_city}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50">
                    {HUMAN_STATUSES[job.current_status] || job.current_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-500">
                  {job.created_date ? format(new Date(job.created_date), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Link 
                    to={createPageUrl(`JobDetail?id=${job.id}`)}
                    className="inline-flex items-center text-sm font-medium text-slate-900 hover:text-slate-700"
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