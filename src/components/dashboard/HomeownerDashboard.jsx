import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { HUMAN_STATUSES } from '@/components/job/JobConstants';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowRight, Home } from 'lucide-react';

export default function HomeownerDashboard({ user }) {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', 'homeowner', user.email],
    queryFn: () => base44.entities.Job.list({ property_email: user.email, company_id: user.company_id }),
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.full_name || 'Homeowner'}</h1>
        <p className="text-slate-500 mt-2">Track the status of your restoration claim.</p>
      </div>

      {!jobs || jobs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            No active claims found linked to your account.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Home className="w-5 h-5 text-slate-500" />
                            {job.property_address_line1}
                        </CardTitle>
                        <CardDescription>
                            {job.property_city}, {job.property_state}
                        </CardDescription>
                    </div>
                    <Badge className="bg-slate-900">
                        {HUMAN_STATUSES[job.current_status]}
                    </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-500">
                        Created: {format(new Date(job.created_date), 'MMMM d, yyyy')}
                    </div>
                    <Link 
                        to={createPageUrl(`JobDetail?id=${job.id}`)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 h-10 px-4 py-2 shadow-sm"
                    >
                        View <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}