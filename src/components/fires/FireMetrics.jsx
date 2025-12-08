import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

export default function FireMetrics({ alerts, visits }) {
  const total = alerts.length;
  
  // Count visits with "Visited" status or alerts with "Converted" status
  const visitedAlertIds = new Set(
    visits.filter(v => v.status === 'Visited').map(v => v.alert_id)
  );
  const convertedCount = alerts.filter(a => a.status === 'Converted').length;
  const visitedCount = visits.filter(v => v.status === 'Visited').length;
  const weWent = convertedCount + visitedAlertIds.size;
  
  // Didn't = Total - We went - Dismissed - OutOfArea
  const dismissedCount = alerts.filter(a => a.status === 'Dismissed').length;
  const outOfAreaCount = visits.filter(v => v.status === 'OutOfArea').length;
  const weDidnt = Math.max(0, total - weWent - dismissedCount - outOfAreaCount);

  const metrics = [
    {
      label: 'Total Fires',
      value: total,
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'We Went',
      value: weWent,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: "We Didn't",
      value: weDidnt,
      icon: XCircle,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{metric.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{metric.value}</p>
              </div>
              <div className={`${metric.bgColor} p-3 rounded-full`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}