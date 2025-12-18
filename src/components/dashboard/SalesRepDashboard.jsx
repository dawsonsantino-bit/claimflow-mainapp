import React from 'react';
import JobList from '@/components/job/JobList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ContextualHelp from '@/components/onboarding/ContextualHelp';

export default function SalesRepDashboard({ user }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Pipeline</h1>
        <Button onClick={() => navigate(createPageUrl('NewJob'))} type="button" data-tour="new-job">
          <Plus className="w-4 h-4 mr-2" />
          New Job
        </Button>
      </div>

      <ContextualHelp
        tipId="sales-dashboard-intro"
        title="Welcome to your Sales Hub!"
        content="Check Fire Alerts for new leads, track your active jobs, and convert opportunities into restoration projects. High-urgency alerts are prioritized for you."
      />
      
      <JobList 
        title="My Jobs" 
        queryFilter={{ sales_rep_user_id: user.id, company_id: user.company_id }} 
      />
    </div>
  );
}