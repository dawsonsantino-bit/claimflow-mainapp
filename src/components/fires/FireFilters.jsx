import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function FireFilters({ filters, setFilters, alerts }) {
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'New', label: 'New' },
    { value: 'Converted', label: 'Converted' },
    { value: 'Dismissed', label: 'Dismissed' }
  ];

  const timeOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' }
  ];

  const severityOptions = [
    { value: 'all', label: 'All Severity' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  // Extract unique providers from alerts
  const providers = ['all', ...new Set(alerts.map(a => a.source).filter(Boolean))];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Time Window</label>
            <Select value={filters.timeWindow} onValueChange={(val) => setFilters({...filters, timeWindow: val})}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-600 mb-1 block">Status</label>
            <Select value={filters.status} onValueChange={(val) => setFilters({...filters, status: val})}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-600 mb-1 block">Provider</label>
            <Select value={filters.provider} onValueChange={(val) => setFilters({...filters, provider: val})}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map(p => (
                  <SelectItem key={p} value={p}>
                    {p === 'all' ? 'All Providers' : p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-600 mb-1 block">Severity</label>
            <Select value={filters.severity} onValueChange={(val) => setFilters({...filters, severity: val})}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}