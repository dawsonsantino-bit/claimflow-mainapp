import React from 'react';
import JobList from '@/components/job/JobList';
import { JOB_STATUSES } from '@/components/job/JobConstants';

export default function HygienistDashboard({ user }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Hygiene Assignments</h1>
      </div>
      
      <JobList 
        title="Pending Swabs & Reports" 
        queryFilter={{ 
          hygienist_user_id: user.id,
          // We could filter by status too, but seeing all assigned jobs is good
        }} 
      />
    </div>
  );
}