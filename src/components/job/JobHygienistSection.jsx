import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Thermometer } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const SWAB_COLORS = {
  Hot: 'bg-red-100 text-red-700 border-red-200',
  'Not Hot': 'bg-green-100 text-green-700 border-green-200',
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function JobHygienistSection({ job, user, readonly = false }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    hygienist_scheduled_at: job.hygienist_scheduled_at ? job.hygienist_scheduled_at.slice(0, 16) : '',
    hygienist_scheduled_window: job.hygienist_scheduled_window || '',
    swab_taken_at: job.swab_taken_at ? job.swab_taken_at.slice(0, 16) : '',
    swab_result: job.swab_result || '',
    swab_notes: job.swab_notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      hygienist_scheduled_at: form.hygienist_scheduled_at ? new Date(form.hygienist_scheduled_at).toISOString() : null,
      hygienist_scheduled_window: form.hygienist_scheduled_window || null,
      swab_taken_at: form.swab_taken_at ? new Date(form.swab_taken_at).toISOString() : null,
      swab_result: form.swab_result || null,
      swab_notes: form.swab_notes || null,
    };
    await base44.entities.Job.update(job.id, updates);
    queryClient.invalidateQueries({ queryKey: ['job', job.id] });
    toast.success('Hygienist info saved');
    setSaving(false);
  };

  if (readonly) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Hygienist / Swab</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {job.hygienist_scheduled_at && <p className="text-slate-600">Scheduled: <strong>{new Date(job.hygienist_scheduled_at).toLocaleString()}</strong>{job.hygienist_scheduled_window ? ` (${job.hygienist_scheduled_window})` : ''}</p>}
          {job.swab_result && <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-slate-400" /><span className="text-slate-600">Swab Result:</span><Badge className={SWAB_COLORS[job.swab_result]}>{job.swab_result}</Badge></div>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-orange-500" /> Hygienist / Swab
          {form.swab_result && <Badge className={SWAB_COLORS[form.swab_result]}>{form.swab_result}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Scheduled Date & Time</Label>
            <Input type="datetime-local" value={form.hygienist_scheduled_at} onChange={e => setForm(f => ({ ...f, hygienist_scheduled_at: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Time Window (e.g. 9am–12pm)</Label>
            <Input placeholder="9am–12pm" value={form.hygienist_scheduled_window} onChange={e => setForm(f => ({ ...f, hygienist_scheduled_window: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Swab Taken Date & Time</Label>
            <Input type="datetime-local" value={form.swab_taken_at} onChange={e => setForm(f => ({ ...f, swab_taken_at: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Swab Result</Label>
            <Select value={form.swab_result} onValueChange={val => setForm(f => ({ ...f, swab_result: val }))}>
              <SelectTrigger><SelectValue placeholder="Select result..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Hot">🔴 Hot</SelectItem>
                <SelectItem value="Not Hot">🟢 Not Hot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Swab Notes</Label>
          <Textarea placeholder="Lab notes, observations, follow-up..." value={form.swab_notes} onChange={e => setForm(f => ({ ...f, swab_notes: e.target.value }))} className="h-20" />
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="bg-slate-900 hover:bg-slate-800">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
}