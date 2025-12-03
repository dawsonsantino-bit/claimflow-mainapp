import React from 'react';
import { Check, Circle, Clock, AlertCircle } from 'lucide-react';
import { JOB_STATUSES, HUMAN_STATUSES } from '@/components/job/JobConstants';
import { cn } from '@/lib/utils';

const STEPS = [
  JOB_STATUSES.LeadCreated,
  JOB_STATUSES.AssessmentDone,
  JOB_STATUSES.ContractSigned,
  JOB_STATUSES.InitialDocumentationComplete,
  JOB_STATUSES.HygienistAssigned,
  JOB_STATUSES.SwabCompletedLabSent,
  JOB_STATUSES.LabResultsProtocolReady,
  JOB_STATUSES.InsuranceNegotiation,
  JOB_STATUSES.InsurancePaidFirstCheck,
  JOB_STATUSES.WorkInProgress,
  JOB_STATUSES.WorkCompleted,
  JOB_STATUSES.FinalCheckToAttorney,
  JOB_STATUSES.ContractorPaidCaseClosed
];

export default function JobWorkflow({ currentStatus }) {
  const currentIndex = STEPS.indexOf(currentStatus);
  
  // If canceled, show simplified or error state
  if (currentStatus === JOB_STATUSES.Canceled) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 mb-6">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">This job has been canceled.</span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-6">
      <div className="min-w-[1000px] flex items-center justify-between px-4 relative">
        {/* Connecting Line */}
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-200 -z-10" />
        
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={step} className="flex flex-col items-center gap-2 relative group">
               <div className={cn(
                 "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all bg-white z-10",
                 isCompleted ? "border-green-500 text-green-500" : 
                 isCurrent ? "border-blue-600 text-blue-600 ring-4 ring-blue-100" : 
                 "border-slate-300 text-slate-300"
               )}>
                 {isCompleted ? <Check className="w-4 h-4" /> : 
                  isCurrent ? <Clock className="w-4 h-4" /> : 
                  <Circle className="w-3 h-3" />}
               </div>
               <span className={cn(
                 "text-xs font-medium text-center max-w-[80px] transition-colors absolute top-10",
                 isCurrent ? "text-blue-600" : 
                 isCompleted ? "text-slate-700" : "text-slate-400"
               )}>
                 {HUMAN_STATUSES[step]}
               </span>
            </div>
          );
        })}
      </div>
      <div className="h-8" /> {/* Spacer for labels */}
    </div>
  );
}