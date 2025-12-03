import React, { useState } from 'react';
import JobList from '@/components/job/JobList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SalesRepDashboard({ user }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Pipeline</h1>
        <Link to={createPageUrl('NewJob')}>
            <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Lead
            </Button>
        </Link>
      </div>
      
      <JobList 
        title="My Assigned Jobs" 
        queryFilter={{ sales_rep_user_id: user.id }} 
      />

      <div className="mt-8 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-500 mb-4">Debug: All Company Jobs (Fallback)</h2>
          <p className="text-xs text-slate-400 mb-4">
            If you don't see your jobs above, check here. This lists all jobs for your company ({user.company_id}).
          </p>
          <JobList 
            title="All Company Jobs" 
            queryFilter={{ company_id: user.company_id }} 
          />
      </div>
    </div>
  );
}