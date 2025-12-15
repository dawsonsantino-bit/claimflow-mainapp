import React, { useState } from 'react';
import JobList from '@/components/job/JobList';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SalesRepDashboard({ user }) {
  const navigate = useNavigate();
  const [showOpenOnly, setShowOpenOnly] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Pipeline</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="open-jobs" checked={showOpenOnly} onCheckedChange={setShowOpenOnly} />
            <Label htmlFor="open-jobs">Open Only</Label>
          </div>
          <Button onClick={() => navigate(createPageUrl('NewJob'))} type="button">
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>
      
      <JobList 
        title={showOpenOnly ? "My Open Jobs" : "All My Jobs"} 
        queryFilter={{ 
          sales_rep_user_id: user.id, 
          company_id: user.company_id,
          ...(showOpenOnly ? { is_closed: false } : {})
        }} 
      />
    </div>
  );
}