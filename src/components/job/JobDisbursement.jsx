import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Save, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_RECIPIENTS = [
  'Hygienist', 'Contractor', 'RestoreMedics', 'Licensee',
  'Homeowner', 'Law Firm', 'Extra 1', 'Extra 2', 'Extra 3', 'Extra 4',
];

export default function JobDisbursement({ job, user }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const { data: lines, isLoading } = useQuery({
    queryKey: ['disbursement', job.id],
    queryFn: () => base44.entities.DisbursementLine.filter({ job_id: job.id }),
  });

  // Initialize rows from DB or create defaults
  useEffect(() => {
    if (!lines) return;
    if (lines.length > 0) {
      setRows(lines.map(l => ({ ...l, _dirty: false })));
    } else {
      // No lines yet; prepare defaults (will be created on first save)
      setRows(DEFAULT_RECIPIENTS.map(label => ({
        id: null,
        job_id: job.id,
        recipient_label: label,
        percent: '',
        amount: '',
        is_auto_calculated: false,
        paid_at: '',
        notes: '',
        _dirty: true,
      })));
    }
  }, [lines]);

  const updateRow = (idx, field, value) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value, _dirty: true } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const row of rows) {
      if (!row._dirty) continue;
      const payload = {
        job_id: job.id,
        recipient_label: row.recipient_label,
        percent: row.percent !== '' ? parseFloat(row.percent) : null,
        amount: row.amount !== '' ? parseFloat(row.amount) : null,
        is_auto_calculated: row.is_auto_calculated || false,
        paid_at: row.paid_at ? new Date(row.paid_at).toISOString() : null,
        notes: row.notes || null,
      };
      if (row.id) {
        await base44.entities.DisbursementLine.update(row.id, payload);
      } else {
        const created = await base44.entities.DisbursementLine.create(payload);
        row.id = created.id;
      }
    }
    setRows(prev => prev.map(r => ({ ...r, _dirty: false })));
    queryClient.invalidateQueries({ queryKey: ['disbursement', job.id] });
    toast.success('Disbursement saved');
    setSaving(false);
  };

  const handleRecalculate = () => {
    setRecalculating(true);
    const total = parseFloat(job.job_total_value);
    if (!total || isNaN(total)) {
      toast.error('Set Job Total Value first');
      setRecalculating(false);
      return;
    }
    setRows(prev => prev.map(r => {
      const pct = parseFloat(r.percent);
      if (pct > 0 && (!r.amount || r.is_auto_calculated)) {
        return { ...r, amount: ((total * pct) / 100).toFixed(2), is_auto_calculated: true, _dirty: true };
      }
      return r;
    }));
    toast.success('Amounts recalculated from percentages');
    setRecalculating(false);
  };

  const totalDisbursed = rows.reduce((sum, r) => {
    const amt = parseFloat(r.amount);
    return r.paid_at && !isNaN(amt) ? sum + amt : sum;
  }, 0);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" /> Profit & Disbursement
            </CardTitle>
            <CardDescription className="text-xs mt-1">Who gets paid what. Enter % and/or amount per recipient.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {job.job_total_value && (
              <Badge variant="outline" className="text-slate-600">
                Total: ${Number(job.job_total_value).toLocaleString()}
              </Badge>
            )}
            {totalDisbursed > 0 && (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" /> Paid: ${totalDisbursed.toLocaleString()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3 min-w-[130px]">Recipient</th>
                <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3 w-20">%</th>
                <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3 w-28">Amount ($)</th>
                <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3 w-36">Paid Date</th>
                <th className="text-left text-xs font-semibold text-slate-500 pb-2 min-w-[120px]">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row, idx) => (
                <tr key={idx} className={row.paid_at ? 'bg-green-50/40' : ''}>
                  <td className="py-1.5 pr-3">
                    <Input
                      value={row.recipient_label}
                      onChange={e => updateRow(idx, 'recipient_label', e.target.value)}
                      className="h-8 text-sm font-medium"
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={row.percent}
                      onChange={e => updateRow(idx, 'percent', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={row.amount}
                        onChange={e => updateRow(idx, 'amount', e.target.value)}
                        className="h-8 text-sm pl-5"
                      />
                    </div>
                  </td>
                  <td className="py-1.5 pr-3">
                    <Input
                      type="date"
                      value={row.paid_at ? row.paid_at.slice(0, 10) : ''}
                      onChange={e => updateRow(idx, 'paid_at', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="py-1.5">
                    <Input
                      placeholder="Notes..."
                      value={row.notes || ''}
                      onChange={e => updateRow(idx, 'notes', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <Button onClick={handleRecalculate} disabled={recalculating} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" /> Recalculate Amounts
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-slate-900 hover:bg-slate-800">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save All'}
          </Button>
          <p className="text-xs text-slate-400 ml-auto">Recalculate fills empty/auto-calc amounts from % × total value.</p>
        </div>
      </CardContent>
    </Card>
  );
}