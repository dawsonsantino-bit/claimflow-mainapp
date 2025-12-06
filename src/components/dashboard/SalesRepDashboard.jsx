import React from 'react';
import JobList from '@/components/job/JobList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SalesRepDashboard({ user }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Pipeline</h1>
        <Button onClick={() => navigate(createPageUrl('NewJob'))} type="button">
          <Plus className="w-4 h-4 mr-2" />
          New Job
        </Button>
      </div>
      
      <JobList 
        title="My Jobs" 
        queryFilter={{ sales_rep_user_id: user.id, company_id: user.company_id }} 
      />
    </div>
  );
}