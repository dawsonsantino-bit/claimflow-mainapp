import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

const STAGE_LABELS = [
  { key: 'final_settlement_at', label: 'Final Settlement', color: 'bg-green-100 text-green-700' },
  { key: 'claim_approved_at', label: 'Claim Approved', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'negotiation_started_at', label: 'In Negotiation', color: 'bg-amber-100 text-amber-700' },
  { key: 'claim_initiated_at', label: 'Claim Initiated', color: 'bg-blue-100 text-blue-700' },
];

const fmt = (val) => val != null ? `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';

export default function JobClaimSummaryCard({ job }) {
  const { data: disbLines } = useQuery({
    queryKey: ['disbursement', job.id],
    queryFn: () => base44.entities.DisbursementLine.filter({ job_id: job.id }),
  });

  const currentStage = STAGE_LABELS.find(s => job[s.key]);

  const totalDisbursed = (disbLines || []).reduce((sum, l) => {
    const amt = parseFloat(l.amount);
    return l.paid_at && !isNaN(amt) ? sum + amt : sum;
  }, 0);

  return (
    <Card className="border-slate-200 bg-slate-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
          <TrendingUp className="w-4 h-4 text-indigo-600" /> Claim Summary
          {currentStage && <Badge className={currentStage.color}>{currentStage.label}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { label: 'Total Value', val: fmt(job.job_total_value) },
            { label: 'Approved', val: fmt(job.insurance_approved_amount) },
            { label: 'Initial Check', val: fmt(job.initial_check_amount) },
            { label: 'Final Check', val: fmt(job.final_check_amount) },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-lg p-3 border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className="font-semibold text-slate-900">{item.val}</p>
            </div>
          ))}
        </div>
        {totalDisbursed > 0 && (
          <p className="text-xs text-slate-500 mt-3">
            Total Disbursed (paid): <strong className="text-green-600">{fmt(totalDisbursed)}</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}