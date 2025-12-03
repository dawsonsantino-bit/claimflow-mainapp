import React from 'react';
import JobList from '@/components/job/JobList';

export default function ContractorDashboard({ user }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Work Orders</h1>
      </div>
      
      <JobList 
        title="Assigned Jobs" 
        queryFilter={{ contractor_user_id: user.id }} 
      />
    </div>
  );
}