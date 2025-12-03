import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, MapPin, FileText, ArrowLeft, Calendar, Info, File, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import HomeownerTimeline from '@/components/homeowner/HomeownerTimeline';
import { HUMAN_STATUSES, JOB_STATUSES } from '@/components/job/JobConstants';
import { createPageUrl } from '@/utils';

// Next Step Mapping
const NEXT_STEPS = {
    [JOB_STATUSES.LeadCreated]: "We will schedule a visit to assess the damage.",
    [JOB_STATUSES.AssessmentDone]: "We will prepare a contract for you to sign.",
    [JOB_STATUSES.ContractSigned]: "We will document the damage with photos before starting.",
    [JOB_STATUSES.InitialDocumentationComplete]: "We will assign a certified hygienist to test for contaminants.",
    [JOB_STATUSES.HygienistAssigned]: "The hygienist will take samples from your property.",
    [JOB_STATUSES.SwabCompletedLabSent]: "We are waiting for the lab to analyze the samples.",
    [JOB_STATUSES.LabResultsProtocolReady]: "We will start negotiating with your insurance company.",
    [JOB_STATUSES.InsuranceNegotiation]: "We are waiting for the insurance company to approve the claim.",
    [JOB_STATUSES.InsurancePaidFirstCheck]: "We will begin the restoration work on your property.",
    [JOB_STATUSES.WorkInProgress]: "We will complete the restoration work.",
    [JOB_STATUSES.WorkCompleted]: "We will wait for the final settlement check.",
    [JOB_STATUSES.FinalCheckToAttorney]: "We will distribute funds and close the case.",
    [JOB_STATUSES.ContractorPaidCaseClosed]: "Case is closed. No further action needed.",
    [JOB_STATUSES.Canceled]: "This case has been canceled."
};

export default function HomeownerJobDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await base44.entities.Job.list({ id: jobId });
      return res[0];
    },
    enabled: !!jobId
  });

  const { data: updates, isLoading: updatesLoading } = useQuery({
    queryKey: ['jobUpdates', jobId],
    queryFn: () => base44.entities.JobUpdate.list({ 
        job_id: jobId, 
        visible_to_homeowner: true 
    }, { created_date: -1 }), // Newest first
    enabled: !!jobId
  });

  const { data: photos, isLoading: photosLoading } = useQuery({
    queryKey: ['jobPhotos', jobId],
    queryFn: () => base44.entities.JobPhoto.list({ 
        job_id: jobId, 
        visible_to_homeowner: true 
    }),
    enabled: !!jobId
  });

  if (jobLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
  }

  if (!job) return <div className="p-8 text-center text-slate-500">Job not found</div>;

  // Helper to filter photos
  const getPhotosByType = (type) => photos?.filter(p => p.photo_type === type) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="space-y-4">
        <Link to={createPageUrl('Dashboard')} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-slate-400" />
                    {job.property_address_line1}
                </h1>
                <p className="text-slate-500 ml-8">{job.property_city}, {job.property_state}</p>
            </div>
            <div className="flex flex-col items-end">
                <Badge className="bg-slate-900 text-white text-base px-4 py-1 mb-1">
                    {HUMAN_STATUSES[job.current_status]}
                </Badge>
                <span className="text-xs text-slate-400 font-mono">Case ID: {job.id.slice(-8)}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Timeline & Quick Info */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-blue-50 border-blue-100 shadow-sm">
                      <CardHeader className="pb-2">
                          <CardTitle className="text-blue-900 text-sm uppercase tracking-wider font-semibold flex items-center gap-2">
                              <Info className="w-4 h-4" /> Happening Now
                          </CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-blue-800 font-medium text-lg mb-2">
                              {HUMAN_STATUSES[job.current_status]}
                          </p>
                          <p className="text-sm text-blue-700/80">
                              {updates && updates.length > 0 ? updates[0].message : "Your case is active. We are working on the current step."}
                          </p>
                      </CardContent>
                  </Card>

                  <Card className="bg-slate-50 border-slate-100 shadow-sm">
                      <CardHeader className="pb-2">
                          <CardTitle className="text-slate-900 text-sm uppercase tracking-wider font-semibold flex items-center gap-2">
                              <Calendar className="w-4 h-4" /> What's Next
                          </CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-slate-600">
                              {NEXT_STEPS[job.current_status] || "We will update you on the next steps."}
                          </p>
                      </CardContent>
                  </Card>
              </div>

              {/* Tabs for Details */}
              <Tabs defaultValue="timeline" className="w-full">
                  <TabsList className="w-full justify-start bg-transparent border-b border-slate-200 rounded-none p-0 h-12 space-x-6">
                      <TabsTrigger 
                        value="timeline" 
                        className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent rounded-none px-0 pb-2 font-medium"
                      >
                          Timeline
                      </TabsTrigger>
                      <TabsTrigger 
                        value="updates" 
                        className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent rounded-none px-0 pb-2 font-medium"
                      >
                          Updates
                      </TabsTrigger>
                      <TabsTrigger 
                        value="photos" 
                        className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent rounded-none px-0 pb-2 font-medium"
                      >
                          Photos & Docs
                      </TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline" className="pt-6">
                      <Card className="border-none shadow-none bg-transparent">
                          <CardContent className="p-0">
                              <HomeownerTimeline currentStatus={job.current_status} />
                          </CardContent>
                      </Card>
                  </TabsContent>

                  <TabsContent value="updates" className="pt-6">
                      <div className="space-y-4">
                          {updatesLoading ? <Loader2 className="animate-spin text-slate-300" /> : 
                           !updates || updates.length === 0 ? (
                              <p className="text-slate-500 italic">No updates yet.</p>
                           ) : (
                              updates.map(update => (
                                  <Card key={update.id} className="border-slate-200 shadow-sm">
                                      <CardHeader className="pb-2 bg-slate-50/50">
                                          <div className="flex justify-between items-baseline">
                                              <CardTitle className="text-base font-semibold text-slate-800">
                                                  {update.title}
                                              </CardTitle>
                                              <span className="text-xs text-slate-500">
                                                  {format(new Date(update.created_date), 'MMM d, h:mm a')}
                                              </span>
                                          </div>
                                      </CardHeader>
                                      <CardContent className="pt-4">
                                          <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed">
                                              {update.message}
                                          </p>
                                      </CardContent>
                                  </Card>
                              ))
                           )}
                      </div>
                  </TabsContent>

                  <TabsContent value="photos" className="pt-6">
                      <div className="space-y-8">
                          {['Before', 'During', 'After'].map(type => {
                              const typePhotos = getPhotosByType(type);
                              if (typePhotos.length === 0) return null;
                              return (
                                  <div key={type} className="space-y-3">
                                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                          <ImageIcon className="w-4 h-4" /> {type} Photos
                                      </h3>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                          {typePhotos.map(photo => (
                                              <a href={photo.url} key={photo.id} target="_blank" rel="noreferrer" className="block group relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                                  <img src={photo.url} alt={type} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                              </a>
                                          ))}
                                      </div>
                                  </div>
                              );
                          })}
                          
                          {(!photos || photos.length === 0) && (
                              <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                  <p className="text-slate-500">No photos or documents shared yet.</p>
                              </div>
                          )}
                      </div>
                  </TabsContent>
              </Tabs>
          </div>

          {/* Right Column: Contact / Help (Optional Placeholder) */}
          <div className="hidden lg:block space-y-6">
               <Card className="bg-slate-50 border-slate-200">
                   <CardHeader>
                       <CardTitle className="text-sm font-semibold text-slate-900">Need Help?</CardTitle>
                   </CardHeader>
                   <CardContent className="text-sm text-slate-600 space-y-2">
                       <p>If you have questions about your claim status, please contact your assigned representative.</p>
                       <div className="pt-4 border-t border-slate-200 mt-4">
                           <p className="font-medium text-slate-900">Emergency Contact</p>
                           <p>(555) 123-4567</p>
                           <p>support@casemanager.com</p>
                       </div>
                   </CardContent>
               </Card>
          </div>
      </div>
    </div>
  );
}