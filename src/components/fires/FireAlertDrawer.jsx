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
import { Calendar, MapPin, CheckCircle, XCircle, UserPlus, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { analyzeLeadQualification } from '@/components/services/FireAlertService';

export default function FireAlertDrawer({ alert, open, onClose, user }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [leadAnalysis, setLeadAnalysis] = useState(null);
  const [analyzingLead, setAnalyzingLead] = useState(false);

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

  const handleConvertToLead = async () => {
    setShowConvertDialog(true);
    setAnalyzingLead(true);
    
    // Create a temporary job object for analysis
    const tempJob = {
      property_owner_name: 'Pending',
      property_address_line1: alert.address_text || '',
      property_city: alert.city || '',
      property_state: alert.state || '',
      property_zip: alert.zip || '',
      loss_type: alert.event_type || 'Fire',
      assessment_notes: alert.description || ''
    };
    
    try {
      const analysis = await analyzeLeadQualification(alert, tempJob);
      setLeadAnalysis(analysis);
    } catch (error) {
      console.error('Failed to analyze lead:', error);
    } finally {
      setAnalyzingLead(false);
    }
  };

  const proceedToNewJob = () => {
    const params = new URLSearchParams({
      address: alert.address_text || '',
      city: alert.city || '',
      state: alert.state || '',
      zip: alert.zip || '',
      notes: alert.description || '',
      source: `Fire Alert: ${alert.source}`,
      ...(leadAnalysis && {
        lead_temp: leadAnalysis.leadTemperature,
        priority: leadAnalysis.priorityScore,
        ai_notes: JSON.stringify({
          reasoning: leadAnalysis.reasoning,
          next_steps: leadAnalysis.nextSteps,
          risk_factors: leadAnalysis.riskFactors,
          opportunities: leadAnalysis.opportunityIndicators
        })
      })
    });
    window.location.href = createPageUrl(`NewJob?${params.toString()}`);
  };

  if (!alert) return null;

  // Lead qualification dialog
  const LeadQualificationDialog = () => (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">AI Lead Qualification</h2>
          </div>
          <p className="text-sm text-slate-600">AI analysis of this fire alert as a restoration lead</p>
        </div>

        <div className="p-6 space-y-6">
          {analyzingLead ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                <p className="text-sm text-slate-600">Analyzing lead quality...</p>
              </div>
            </div>
          ) : leadAnalysis && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">Lead Temperature</p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        leadAnalysis.leadTemperature === 'hot' ? 'destructive' : 
                        leadAnalysis.leadTemperature === 'warm' ? 'default' : 
                        'secondary'
                      }
                      className="text-lg px-3 py-1"
                    >
                      {leadAnalysis.leadTemperature.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">Priority Score</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {leadAnalysis.priorityScore}<span className="text-sm text-slate-500">/10</span>
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-xs font-medium text-indigo-900 mb-2">AI Reasoning</p>
                <p className="text-sm text-indigo-800">{leadAnalysis.reasoning}</p>
              </div>

              {leadAnalysis.nextSteps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Recommended Next Steps</h3>
                  <ol className="space-y-2">
                    {leadAnalysis.nextSteps.map((step, idx) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <span className="font-medium text-indigo-600 shrink-0">{idx + 1}.</span>
                        <span className="text-slate-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {leadAnalysis.opportunityIndicators.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Opportunity Indicators</h3>
                  <ul className="space-y-1">
                    {leadAnalysis.opportunityIndicators.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {leadAnalysis.riskFactors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Risk Factors</h3>
                  <ul className="space-y-1">
                    {leadAnalysis.riskFactors.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {leadAnalysis.estimatedUrgencyHours && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-900 mb-1">⏱️ Urgency</p>
                  <p className="text-sm text-amber-800">
                    Contact within <strong>{leadAnalysis.estimatedUrgencyHours} hours</strong>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowConvertDialog(false);
              setLeadAnalysis(null);
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={proceedToNewJob}
            disabled={analyzingLead}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Create Lead
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {showConvertDialog && <LeadQualificationDialog />}
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
    </>
  );
}