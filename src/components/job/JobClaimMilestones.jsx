import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const MILESTONES = [
  { key: 'claim_initiated_at', label: 'Claim Initiated', color: 'bg-blue-100 text-blue-700' },
  { key: 'negotiation_started_at', label: 'In Negotiation', color: 'bg-amber-100 text-amber-700' },
  { key: 'claim_approved_at', label: 'Claim Approved', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'final_settlement_at', label: 'Final Settlement', color: 'bg-green-100 text-green-700' },
];

export default function JobClaimMilestones({ job, user, readonly = false }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(
    Object.fromEntries(MILESTONES.map(m => [m.key, job[m.key] ? job[m.key].slice(0, 10) : '']))
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.fromEntries(
      MILESTONES.map(m => [m.key, form[m.key] ? new Date(form[m.key]).toISOString() : null])
    );
    await base44.entities.Job.update(job.id, updates);
    queryClient.invalidateQueries({ queryKey: ['job', job.id] });
    toast.success('Milestones saved');
    setSaving(false);
  };

  // Determine current stage
  const currentStage = [...MILESTONES].reverse().find(m => job[m.key]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Claim Milestones
          {currentStage && <Badge className={currentStage.color}>{currentStage.label}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MILESTONES.map(m => {
            const done = !!job[m.key];
            return (
              <div key={m.key} className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  {done
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                  {m.label}
                </Label>
                {readonly ? (
                  <p className="text-sm text-slate-700">{job[m.key] ? new Date(job[m.key]).toLocaleDateString() : '—'}</p>
                ) : (
                  <Input
                    type="date"
                    value={form[m.key]}
                    onChange={e => setForm(f => ({ ...f, [m.key]: e.target.value }))}
                  />
                )}
              </div>
            );
          })}
        </div>
        {!readonly && (
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-slate-900 hover:bg-slate-800">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Milestones'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}