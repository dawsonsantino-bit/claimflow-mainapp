import React, { useState } from 'react';
import JobList from '@/components/job/JobList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import JobCreateDialog from '@/components/job/JobCreateDialog';

export default function SalesRepDashboard({ user }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Pipeline</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Lead
        </Button>
      </div>
      
      <JobList 
        title="My Jobs" 
        queryFilter={{ sales_rep_user_id: user.id }} 
      />

      {showCreate && (
        <JobCreateDialog 
          open={showCreate} 
          onOpenChange={setShowCreate} 
          user={user}
        />
      )}
    </div>
  );
}