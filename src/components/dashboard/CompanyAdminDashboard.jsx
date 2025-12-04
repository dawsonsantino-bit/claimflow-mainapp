import React from 'react';
import JobList from '@/components/job/JobList';
import { USER_ROLES } from '@/components/job/JobConstants';

export default function CompanyAdminDashboard({ user }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>
      <JobList 
        title="All Jobs" 
        queryFilter={{}} 
      />
    </div>
  );
}