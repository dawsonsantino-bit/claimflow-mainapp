import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { USER_ROLES } from '@/components/job/JobConstants';

import JobWorkflow from '@/components/job/JobWorkflow';
import JobStatusManager from '@/components/job/JobStatusManager';
import JobActionPanel from '@/components/job/JobActionPanel';
import JobOverview from '@/components/job/JobOverview';
import JobPhotos from '@/components/job/JobPhotos';
import JobNegotiations from '@/components/job/JobNegotiations'; // To create
import JobPayments from '@/components/job/JobPayments'; // To create
import JobDocumentCenter from '@/components/job/JobDocumentCenter';

export default function JobDetail() {
  const queryClient = useQueryClient();
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
      // Try to list by ID without any other filters
      // Note: backend permissions might still filter this if multi-tenant is strict
      const res = await base44.entities.Job.list({ id: jobId });
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
        <p className="text-slate-400 text-sm mt-4">Please ensure you have permission to view this job.</p>
        <div className="mt-4 p-4 bg-slate-100 rounded text-xs text-left inline-block">
          <p><strong>Debug Info:</strong></p>
          <p>User Company: {user.company_id || 'null'}</p>
          <p>User Location: {user.location_id || 'null'}</p>
        </div>
    </div>
  );

  const isHomeowner = user.business_role === USER_ROLES.Homeowner;
  const isAttorney = user.business_role === USER_ROLES.Attorney;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{job.property_owner_name}</h1>
        <p className="text-slate-500">{job.property_address_line1}, {job.property_city}</p>
      </div>

      <JobWorkflow currentStatus={job.current_status} />

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
          {!isHomeowner && <TabsTrigger value="documents">AI Docs</TabsTrigger>}
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