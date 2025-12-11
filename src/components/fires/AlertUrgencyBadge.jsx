import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Flame, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AlertUrgencyBadge({ urgency, showBreakdown = false }) {
  if (!urgency) return null;

  const getTierConfig = (tier) => {
    switch (tier) {
      case 'critical':
        return {
          icon: Flame,
          color: 'bg-red-600 text-white hover:bg-red-700',
          label: 'CRITICAL',
          borderColor: 'border-red-600'
        };
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'bg-orange-600 text-white hover:bg-orange-700',
          label: 'HIGH',
          borderColor: 'border-orange-600'
        };
      case 'medium':
        return {
          icon: TrendingUp,
          color: 'bg-amber-600 text-white hover:bg-amber-700',
          label: 'MEDIUM',
          borderColor: 'border-amber-600'
        };
      default:
        return {
          icon: Info,
          color: 'bg-slate-600 text-white hover:bg-slate-700',
          label: 'LOW',
          borderColor: 'border-slate-600'
        };
    }
  };

  const config = getTierConfig(urgency.urgencyTier);
  const Icon = config.icon;

  const breakdownContent = urgency.breakdown ? (
    <div className="space-y-2">
      <p className="font-semibold text-white mb-2">Urgency Breakdown:</p>
      {urgency.breakdown.time > 0 && (
        <div className="flex justify-between text-xs">
          <span>Time Sensitivity:</span>
          <span className="font-medium">{urgency.breakdown.time} pts</span>
        </div>
      )}
      {urgency.breakdown.business > 0 && (
        <div className="flex justify-between text-xs">
          <span>Business Potential:</span>
          <span className="font-medium">{urgency.breakdown.business} pts</span>
        </div>
      )}
      {urgency.breakdown.confidence > 0 && (
        <div className="flex justify-between text-xs">
          <span>Confidence Level:</span>
          <span className="font-medium">{urgency.breakdown.confidence} pts</span>
        </div>
      )}
      {urgency.breakdown.property > 0 && (
        <div className="flex justify-between text-xs">
          <span>Property Impact:</span>
          <span className="font-medium">{urgency.breakdown.property} pts</span>
        </div>
      )}
      {urgency.breakdown.competition > 0 && (
        <div className="flex justify-between text-xs">
          <span>Competition Risk:</span>
          <span className="font-medium">{urgency.breakdown.competition} pts</span>
        </div>
      )}
      <div className="border-t border-slate-600 pt-2 mt-2">
        <div className="flex justify-between text-sm font-bold">
          <span>Total Score:</span>
          <span>{urgency.urgencyScore}/100</span>
        </div>
      </div>
      {urgency.reasoning && (
        <p className="text-xs text-slate-300 mt-2 pt-2 border-t border-slate-600">
          {urgency.reasoning}
        </p>
      )}
      {urgency.responseTimeframe && (
        <p className="text-xs text-amber-300 mt-2">
          ⏱️ {urgency.responseTimeframe}
        </p>
      )}
    </div>
  ) : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${config.color} cursor-help text-xs font-semibold px-2 py-1`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label} {urgency.urgencyScore}
          </Badge>
        </TooltipTrigger>
        {showBreakdown && breakdownContent && (
          <TooltipContent className="bg-slate-800 border-slate-700 max-w-xs">
            {breakdownContent}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}