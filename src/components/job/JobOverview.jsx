import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Calendar, Phone, Mail, FileText, Activity } from 'lucide-react';
import { HUMAN_STATUSES } from '@/components/job/JobConstants';

export default function JobOverview({ job, user }) {
  const { data: history } = useQuery({
    queryKey: ['jobHistory', job.id],
    queryFn: () => base44.entities.JobStatusHistory.list({ job_id: job.id }, { changed_at: -1 }),
  });

  // Fetch assigned users names (optimization: could be done better but ok for now)
  // We'll just display IDs or "Assigned" if we don't have the names easily available without N+1 queries
  // For MVP, just showing "Assigned" or IDs is acceptable, but let's try to show something better if possible
  // Actually job entity has the user IDs. We won't fetch details for each for now to keep it simple.

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
      <Icon className="w-4 h-4 text-slate-400 mt-1" />
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase">{label}</p>
        <p className="text-sm text-slate-900">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow icon={User} label="Property Owner" value={job.property_owner_name} />
            <InfoRow icon={MapPin} label="Address" value={`${job.property_address_line1}, ${job.property_city} ${job.property_zip}`} />
            <InfoRow icon={Phone} label="Phone" value={job.property_phone} />
            <InfoRow icon={Mail} label="Email" value={job.property_email} />
            <InfoRow icon={Activity} label="Loss Type" value={job.loss_type} />
            <InfoRow icon={Calendar} label="Created" value={job.lead_created_at ? format(new Date(job.lead_created_at), 'PPP') : '-'} />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {history?.map((h, i) => (
                    <div key={h.id} className="flex gap-4 relative">
                        {i !== history.length - 1 && (
                            <div className="absolute left-[15px] top-6 bottom-[-24px] w-0.5 bg-slate-100" />
                        )}
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 z-10">
                            <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">
                                Changed to <span className="text-blue-600">{HUMAN_STATUSES[h.to_status]}</span>
                            </p>
                            <p className="text-xs text-slate-500">
                                {format(new Date(h.changed_at), 'PP p')}
                            </p>
                            {h.note && (
                                <p className="text-sm bg-slate-50 p-2 rounded mt-1 text-slate-600">{h.note}</p>
                            )}
                        </div>
                    </div>
                ))}
                {(!history || history.length === 0) && <p className="text-slate-500">No history recorded.</p>}
            </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <InfoRow icon={User} label="Sales Rep" value={job.sales_rep_user_id ? 'Assigned' : 'Pending'} />
             <InfoRow icon={User} label="Hygienist" value={job.hygienist_user_id ? 'Assigned' : 'Pending'} />
             <InfoRow icon={User} label="Attorney" value={job.attorney_user_id ? 'Assigned' : 'Pending'} />
             <InfoRow icon={User} label="Contractor" value={job.contractor_user_id ? 'Assigned' : 'Pending'} />
          </CardContent>
        </Card>
        
        {job.lab_name && (
            <Card>
                <CardHeader>
                    <CardTitle>Lab Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <InfoRow icon={FileText} label="Lab Name" value={job.lab_name} />
                    <InfoRow icon={FileText} label="Case ID" value={job.lab_case_id} />
                    <div className="pt-2">
                        <p className="text-xs font-medium text-slate-500 uppercase mb-1">Result</p>
                        <Badge variant={job.lab_result_status === 'Clear' ? 'default' : 'destructive'}>
                            {job.lab_result_status || 'Pending'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}