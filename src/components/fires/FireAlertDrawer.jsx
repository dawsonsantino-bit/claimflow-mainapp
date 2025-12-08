import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, CheckCircle, XCircle, UserPlus, ExternalLink } from 'lucide-react';

export default function FireAlertDrawer({ alert, open, onClose, user }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, data }) => await base44.entities.FireAlert.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fireAlerts']);
      onClose();
    }
  });

  const createVisitMutation = useMutation({
    mutationFn: async (visitData) => await base44.entities.FireVisit.create(visitData),
    onSuccess: () => {
      queryClient.invalidateQueries(['fireVisits']);
    }
  });

  const handleMarkVisited = async () => {
    await createVisitMutation.mutateAsync({
      company_id: user.company_id,
      alert_id: alert.id,
      rep_user_id: user.id,
      status: 'Visited',
      visited_at: new Date().toISOString(),
      notes: notes || 'Marked as visited'
    });
    onClose();
  };

  const handleScheduleVisit = async () => {
    await createVisitMutation.mutateAsync({
      company_id: user.company_id,
      alert_id: alert.id,
      rep_user_id: user.id,
      status: 'Scheduled',
      scheduled_at: new Date().toISOString(),
      notes: notes || 'Scheduled for visit'
    });
    onClose();
  };

  const handleDismiss = async () => {
    await updateAlertMutation.mutateAsync({
      id: alert.id,
      data: { status: 'Dismissed' }
    });
  };

  const handleConvertToLead = () => {
    // Navigate to NewJob with prefilled data
    const params = new URLSearchParams({
      address: alert.address_text || '',
      city: alert.city || '',
      state: alert.state || '',
      zip: alert.zip || '',
      notes: alert.description || '',
      source: `Fire Alert: ${alert.source}`
    });
    window.location.href = createPageUrl(`NewJob?${params.toString()}`);
  };

  if (!alert) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            {alert.headline || alert.event_type || 'Fire Alert'}
          </SheetTitle>
          <SheetDescription>
            {alert.source} • {new Date(alert.received_at).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">Status</h3>
            <Badge variant={alert.status === 'New' ? 'default' : alert.status === 'Converted' ? 'success' : 'secondary'}>
              {alert.status}
            </Badge>
          </div>

          {alert.description && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-2">Description</h3>
              <p className="text-sm text-slate-700">{alert.description}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">Location</h3>
            <p className="text-sm text-slate-700">
              {alert.address_text || `${alert.city}, ${alert.state} ${alert.zip}`}
            </p>
            {alert.lat && alert.lon && (
              <p className="text-xs text-slate-500 mt-1">
                Coordinates: {alert.lat.toFixed(4)}, {alert.lon.toFixed(4)}
              </p>
            )}
          </div>

          {(alert.severity || alert.confidence) && (
            <div className="grid grid-cols-2 gap-4">
              {alert.severity && (
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-1">Severity</h3>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              )}
              {alert.confidence && (
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-1">Confidence</h3>
                  <p className="text-sm text-slate-700">{Math.round(alert.confidence * 100)}%</p>
                </div>
              )}
            </div>
          )}

          {alert.occurred_at && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-1">Occurred</h3>
              <p className="text-sm text-slate-700">{new Date(alert.occurred_at).toLocaleString()}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">Notes</h3>
            <Textarea
              placeholder="Add notes about this alert..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24"
            />
          </div>

          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium text-slate-900 mb-3">Actions</h3>
            
            {alert.status === 'New' && (
              <>
                <Button 
                  onClick={handleConvertToLead}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Convert to Lead
                </Button>
                
                <Button 
                  onClick={handleScheduleVisit}
                  variant="outline"
                  className="w-full"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Visit
                </Button>

                <Button 
                  onClick={handleMarkVisited}
                  variant="outline"
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Visited
                </Button>

                <Button 
                  onClick={handleDismiss}
                  variant="ghost"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Dismiss
                </Button>
              </>
            )}

            {alert.matched_job_id && (
              <Button
                onClick={() => window.location.href = createPageUrl(`JobDetail?id=${alert.matched_job_id}`)}
                variant="outline"
                className="w-full"
              >
                View Linked Job
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}