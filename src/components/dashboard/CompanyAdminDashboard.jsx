import React, { useState } from 'react';
import JobList from '@/components/job/JobList';
import { HUMAN_STATUSES } from '@/components/job/JobConstants';
import { base44 } from '@/api/base44Client';
import { AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ContextualHelp from '@/components/onboarding/ContextualHelp';

function StagnantJobsAlert({ user }) {
    const [stagnantJobs, setStagnantJobs] = useState([]);

    React.useEffect(() => {
        const checkStagnant = async () => {
            // Fetch active jobs
            const jobs = await base44.entities.Job.filter({ 
                company_id: user.company_id,
                current_status: { $ne: 'ContractorPaidCaseClosed' } 
            });
            
            const now = new Date();
            const stagnant = jobs.filter(j => {
                const updated = new Date(j.updated_date || j.created_date);
                const diffTime = Math.abs(now - updated);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                return diffDays > 7; 
            });
            setStagnantJobs(stagnant);
        };
        if (user.company_id) checkStagnant();
    }, [user.company_id]);

    if (stagnantJobs.length === 0) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
                <h3 className="font-semibold text-amber-900">Attention Needed: {stagnantJobs.length} Stagnant Jobs</h3>
                <p className="text-sm text-amber-700 mb-2">These jobs haven't been updated in over 7 days.</p>
                <div className="flex gap-2 flex-wrap">
                    {stagnantJobs.slice(0, 3).map(j => (
                        <span key={j.id} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            {j.property_owner_name} ({HUMAN_STATUSES[j.current_status]})
                        </span>
                    ))}
                    {stagnantJobs.length > 3 && <span className="text-xs text-amber-600 self-center">+{stagnantJobs.length - 3} more</span>}
                </div>
            </div>
        </div>
    );
}

export default function CompanyAdminDashboard({ user }) {
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex items-center space-x-2">
            <Switch id="open-claims" checked={showOpenOnly} onCheckedChange={setShowOpenOnly} />
            <Label htmlFor="open-claims">Open Claims Only</Label>
        </div>
      </div>

      <ContextualHelp
        tipId="admin-dashboard-intro"
        title="Welcome to your Company Dashboard!"
        content="Monitor all jobs, track team performance, and manage your restoration business from here. Click Help in the sidebar for detailed guidance."
      />

      <StagnantJobsAlert user={user} />

      <JobList 
        title={showOpenOnly ? "Open Claims" : "All Jobs"}
        queryFilter={{ 
            company_id: user.company_id, 
            ...(showOpenOnly ? { is_closed: false } : {}) 
        }} 
      />
    </div>
  );
}