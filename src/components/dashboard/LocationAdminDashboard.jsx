import React from 'react';
import JobList from '@/components/job/JobList';

export default function LocationAdminDashboard({ user }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Location Dashboard</h1>
      </div>
      <JobList 
        title="Location Jobs" 
        queryFilter={{ location_id: user.location_id }} 
      />
    </div>
  );
}