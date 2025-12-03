import React from 'react';
import { CheckCircle2, Circle, Clock, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JOB_STATUSES } from '@/components/job/JobConstants';

const TIMELINE_STEPS = [
  { status: JOB_STATUSES.LeadCreated, label: "Lead Created" },
  { status: JOB_STATUSES.AssessmentDone, label: "Sales Visit Completed" },
  { status: JOB_STATUSES.ContractSigned, label: "Contract Signed" },
  { status: JOB_STATUSES.InitialDocumentationComplete, label: "Evidence & Photos Collected" },
  { status: JOB_STATUSES.HygienistAssigned, label: "Hygienist Assigned" },
  { status: JOB_STATUSES.SwabCompletedLabSent, label: "Swab Completed & Sent to Lab" },
  { status: JOB_STATUSES.LabResultsProtocolReady, label: "Lab Results & Protocol Ready" },
  { status: JOB_STATUSES.InsuranceNegotiation, label: "Insurance Negotiation" },
  { status: JOB_STATUSES.InsurancePaidFirstCheck, label: "Insurance Paid First Check" },
  { status: JOB_STATUSES.WorkInProgress, label: "Work In Progress" },
  { status: JOB_STATUSES.WorkCompleted, label: "Work Completed" },
  { status: JOB_STATUSES.FinalCheckToAttorney, label: "Final Check to Attorney" },
  { status: JOB_STATUSES.ContractorPaidCaseClosed, label: "Contractor Paid & Case Closed" },
];

export default function HomeownerTimeline({ currentStatus }) {
  const currentIndex = TIMELINE_STEPS.findIndex(s => s.status === currentStatus);
  
  // Handle edge case if status is not in list (e.g. canceled) or weird state
  // If Canceled, maybe show it specially? 
  // For now, let's assume linear flow.
  
  return (
    <div className="relative">
      {/* Vertical line for mobile, Horizontal for desktop? 
          User said "horizontal or vertical". Vertical is often safer for long lists of 13 items. 
          Let's go with Vertical for clarity on all devices. */}
      
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

      <div className="space-y-6">
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={step.status} className="relative flex items-start group">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 z-10 bg-white transition-colors",
                isCompleted ? "border-green-500 text-green-500" : 
                isCurrent ? "border-blue-600 text-blue-600 ring-4 ring-blue-50" : 
                "border-slate-300 text-slate-300"
              )}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              
              <div className="ml-4 pt-1">
                <p className={cn(
                  "font-medium text-sm transition-colors",
                  isCompleted ? "text-slate-900" :
                  isCurrent ? "text-blue-700 font-bold text-base" :
                  "text-slate-400"
                )}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">In Progress</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}