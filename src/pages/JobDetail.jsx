import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { USER_ROLES } from '@/components/job/JobConstants';
import { Permissions } from '@/utils/permissions';

import JobWorkflow from '@/components/job/JobWorkflow';
import JobStatusManager from '@/components/job/JobStatusManager';
import JobActionPanel from '@/components/job/JobActionPanel';
import JobOverview from '@/components/job/JobOverview';
import JobPhotos from '@/components/job/JobPhotos';
import JobUpdatesList from '@/components/job/JobUpdatesList';
import JobNegotiations from '@/components/job/JobNegotiations'; // To create
import JobPayments from '@/components/job/JobPayments'; // To create
import JobDocumentCenter from '@/components/job/JobDocumentCenter';

export default function JobDetail() {
  const queryClient = useQueryClient();
  // Using URLSearchParams to get ID from query string (e.g. ?id=123)
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');
  
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
        try {
            const u = await base44.auth.me();
            setUser(u);
        } catch (e) { console.error(e); }
    };
    init();
  }, []);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      // Use filter instead of list for querying by specific fields
      let res = await base44.entities.Job.filter({ id: jobId });
      if (!res || res.length === 0) {
          // Fallback to _id
          res = await base44.entities.Job.filter({ _id: jobId });
      }
      return res[0];
    },
    enabled: !!jobId
  });

  if (isLoading || !user) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  if (job && job.company_id !== user.company_id) {
    // Just a warning for debugging, don't block
    console.warn("Job company_id mismatch:", job.company_id, user.company_id);
  }

  if (!job) return (
    <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Job not found</h2>
        <p className="text-slate-500">Could not find job with ID: {jobId}</p>
    </div>
  );

  // Permission Check
  if (!Permissions.canViewJob(user, job)) {
      return (
        <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🚫</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-500 mb-6">You do not have permission to view this job.</p>
            <div className="p-4 bg-slate-50 rounded text-sm text-left inline-block max-w-md">
                <p className="font-semibold mb-2 text-slate-700">Why am I seeing this?</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>You are signed in as <strong>{user.business_role}</strong></li>
                    <li>This job is assigned to:</li>
                    {job.sales_rep_user_id && <li>Sales Rep: {job.sales_rep_user_id === user.id ? '(You)' : job.sales_rep_user_id}</li>}
                    {job.contractor_user_id && <li>Contractor: {job.contractor_user_id === user.id ? '(You)' : job.contractor_user_id}</li>}
                    {job.hygienist_user_id && <li>Hygienist: {job.hygienist_user_id === user.id ? '(You)' : job.hygienist_user_id}</li>}
                </ul>
            </div>
        </div>
      );
  }

  const isHomeowner = user.business_role === USER_ROLES.Homeowner;
  const isAttorney = user.business_role === USER_ROLES.Attorney;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{job.property_owner_name}</h1>
        <p className="text-slate-500">{job.property_address_line1}, {job.property_city}</p>
      </div>

      <JobWorkflow currentStatus={job.current_status} />

      {/* Homeowner Updates Section */}
      {isHomeowner && (
         <div className="mb-6">
             <JobUpdatesList job={job} />
         </div>
      )}

      {!isHomeowner && (
        <>
            <JobStatusManager job={job} user={user} />
            <JobActionPanel job={job} user={user} />
        </>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos">Photos & Docs</TabsTrigger>
          {/* Only Attorney or Admin sees Negotiations/Payments tabs fully, but Homeowner might see summary */}
          {(isAttorney || user.business_role.includes('Admin')) && (
            <>
                <TabsTrigger value="negotiation">Negotiation</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
            </>
          )}
          {!isHomeowner && <TabsTrigger value="documents" className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> AI Docs</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <JobOverview job={job} user={user} />
        </TabsContent>
        
        <TabsContent value="photos" className="mt-6">
           <JobPhotos job={job} user={user} />
        </TabsContent>

        {(isAttorney || user.business_role.includes('Admin')) && (
            <>
                <TabsContent value="negotiation" className="mt-6">
                    <JobNegotiations job={job} user={user} />
                </TabsContent>
                <TabsContent value="financials" className="mt-6">
                    <JobPayments job={job} user={user} />
                </TabsContent>
            </>
        )}
        <TabsContent value="documents" className="mt-6">
            <JobDocumentCenter job={job} user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}