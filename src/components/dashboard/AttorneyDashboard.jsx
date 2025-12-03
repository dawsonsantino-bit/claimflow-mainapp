import React from 'react';
import JobList from '@/components/job/JobList';

export default function AttorneyDashboard({ user }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Legal Dashboard</h1>
      </div>
      
      <JobList 
        title="Active Cases" 
        queryFilter={{ 
            // Attorney sees all jobs for now, or filter by assignment if we had an assigned attorney field
            // The prompt says "Attorney assignment: attach attorney_user_id"
            attorney_user_id: user.id
        }} 
      />
    </div>
  );
}