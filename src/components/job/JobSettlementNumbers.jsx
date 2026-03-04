import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Save, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const MONEY_FIELDS = [
  { key: 'job_total_value', label: 'Job Total Value' },
  { key: 'insurance_approved_amount', label: 'Insurance Approved Amount' },
  { key: 'initial_check_amount', label: 'Initial Check Amount' },
  { key: 'final_check_amount', label: 'Final Check Amount' },
  { key: 'deductible_amount', label: 'Deductible Amount' },
  { key: 'depreciation_amount', label: 'Depreciation Amount' },
];

const PCT_FIELDS = [
  { key: 'insurance_coverage_percent', label: 'Insurance Coverage %' },
  { key: 'attorney_percent', label: 'Attorney %' },
  { key: 'hygienist_percent', label: 'Hygienist %' },
  { key: 'contractor_percent', label: 'Contractor %' },
  { key: 'restoremedics_percent', label: 'RestoreMedics %' },
  { key: 'licensee_percent', label: 'Licensee %' },
];

export default function JobSettlementNumbers({ job, user, homeownerView = false, readonly = false }) {
  const queryClient = useQueryClient();

  const visibleMoney = homeownerView
    ? MONEY_FIELDS.filter(f => ['insurance_approved_amount', 'initial_check_amount', 'final_check_amount'].includes(f.key))
    : MONEY_FIELDS;

  const [form, setForm] = useState(
    Object.fromEntries([...MONEY_FIELDS, ...PCT_FIELDS].map(f => [f.key, job[f.key] ?? '']))
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.fromEntries(
      [...MONEY_FIELDS, ...PCT_FIELDS].map(f => [f.key, form[f.key] !== '' ? parseFloat(form[f.key]) : null])
    );
    await base44.entities.Job.update(job.id, updates);
    queryClient.invalidateQueries({ queryKey: ['job', job.id] });
    toast.success('Settlement numbers saved');
    setSaving(false);
  };

  const claimApprovedButMissingAmount = job.claim_approved_at && !job.insurance_approved_amount;
  const finalSettledButMissingCheck = job.final_settlement_at && !job.final_check_amount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          {homeownerView ? 'Settlement Summary' : 'Settlement Numbers'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {claimApprovedButMissingAmount && !homeownerView && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Claim is marked Approved but Insurance Approved Amount is missing.
          </div>
        )}
        {finalSettledButMissingCheck && !homeownerView && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Final Settlement is set but Final Check Amount is missing.
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Amounts</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleMoney.map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                {readonly ? (
                  <p className="text-sm font-medium text-slate-800">
                    {form[f.key] !== '' ? `$${Number(form[f.key]).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                  </p>
                ) : (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="pl-6"
                      value={form[f.key]}
                      onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {!homeownerView && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3 mt-2">Percentages</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PCT_FIELDS.map(f => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">{f.label}</Label>
                  {readonly ? (
                    <p className="text-sm font-medium text-slate-800">{form[f.key] !== '' ? `${form[f.key]}%` : '—'}</p>
                  ) : (
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="pr-6"
                        value={form[f.key]}
                        onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!readonly && (
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-slate-900 hover:bg-slate-800">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Numbers'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}