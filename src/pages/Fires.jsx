import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Flame, CheckCircle, XCircle, Calendar, User, Plus, Sparkles } from 'lucide-react';
import { USER_ROLES } from '@/components/job/JobConstants';
import FireMap from '@/components/fires/FireMap';
import FireAlertDrawer from '@/components/fires/FireAlertDrawer';
import FireMetrics from '@/components/fires/FireMetrics';
import FireFilters from '@/components/fires/FireFilters';
import AddTestAlertDialog from '@/components/fires/AddTestAlertDialog';
import { generateAlertSummary } from '@/components/services/FireAlertService';

export default function Fires() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  
  const [filters, setFilters] = useState({
    timeWindow: '24h',
    status: 'all',
    provider: 'all',
    severity: 'all',
    assignedRep: 'all'
  });

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {
        console.error('Auth error', e);
      }
    };
    init();
  }, []);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['fireAlerts', user?.company_id, filters],
    queryFn: async () => {
      if (!user?.company_id) return [];
      
      let query = { company_id: user.company_id };
      
      // Filter by status
      if (filters.status !== 'all') {
        query.status = filters.status;
      }
      
      // Filter by time window
      const now = new Date();
      let sinceDate = new Date();
      if (filters.timeWindow === '24h') {
        sinceDate.setHours(now.getHours() - 24);
      } else if (filters.timeWindow === '7d') {
        sinceDate.setDate(now.getDate() - 7);
      } else if (filters.timeWindow === '30d') {
        sinceDate.setDate(now.getDate() - 30);
      }
      
      const result = await base44.entities.FireAlert.list('-received_at', 500);
      
      // Client-side filtering (until backend supports complex queries)
      return result.filter(alert => {
        if (alert.company_id !== user.company_id) return false;
        
        const receivedAt = new Date(alert.received_at);
        if (receivedAt < sinceDate) return false;
        
        if (filters.severity !== 'all' && alert.severity !== filters.severity) return false;
        if (filters.provider !== 'all' && alert.source !== filters.provider) return false;
        if (filters.assignedRep !== 'all' && alert.assigned_rep_id !== filters.assignedRep) return false;
        
        return true;
      });
    },
    enabled: !!user?.company_id,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['fireVisits', user?.company_id],
    queryFn: async () => {
      if (!user?.company_id) return [];
      return await base44.entities.FireVisit.list('-created_at', 1000);
    },
    enabled: !!user?.company_id,
  });

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setDrawerOpen(true);
  };

  const handleGenerateSummaries = async () => {
    if (alerts.length === 0) return;
    
    setLoadingSummaries(true);
    const newSummaries = {};
    
    // Generate summaries for alerts that don't have one yet
    for (const alert of alerts.slice(0, 10)) { // Limit to first 10 for performance
      if (!summaries[alert.id]) {
        try {
          const summary = await generateAlertSummary(alert);
          newSummaries[alert.id] = summary;
        } catch (error) {
          console.error('Failed to generate summary for alert', alert.id, error);
        }
      }
    }
    
    setSummaries(prev => ({ ...prev, ...newSummaries }));
    setLoadingSummaries(false);
  };

  if (!user) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  // Permission check
  if (![USER_ROLES.CompanyAdmin, USER_ROLES.LocationAdmin, USER_ROLES.SalesRep].includes(user.business_role)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
        <p className="text-slate-500">Fire Alerts are only available to Admins and Sales Reps.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-600" />
            Fire Alerts
          </h1>
          <p className="text-sm text-slate-500">Real-time fire incident tracking and lead generation</p>
        </div>
        <Button onClick={() => setShowTestDialog(true)} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Test Alert
        </Button>
      </div>

      <FireMetrics alerts={alerts} visits={visits} />

      <FireFilters filters={filters} setFilters={setFilters} alerts={alerts} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alert Map & List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FireMap 
            alerts={alerts} 
            onAlertClick={handleAlertClick}
            isLoading={isLoading}
          />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">{alerts.length} alerts</p>
              <Button 
                onClick={handleGenerateSummaries}
                variant="outline" 
                size="sm"
                disabled={loadingSummaries || alerts.length === 0}
              >
                {loadingSummaries ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-2" />
                    AI Summaries
                  </>
                )}
              </Button>
            </div>

            <div className="max-h-[500px] overflow-y-auto border rounded">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin text-slate-400" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center p-8 text-slate-500">
                  <Flame className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No fire alerts found</p>
                  <p className="text-sm">Adjust filters or add a test alert to get started</p>
                </div>
              ) : (
                <div className="divide-y">
                  {alerts.map(alert => {
                    const summary = summaries[alert.id];
                    return (
                      <div 
                        key={alert.id} 
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => handleAlertClick(alert)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900 truncate">
                                {alert.headline || alert.event_type || 'Fire Alert'}
                              </h3>
                              <Badge 
                                variant={alert.status === 'New' ? 'default' : alert.status === 'Converted' ? 'success' : 'secondary'}
                                className="text-xs shrink-0"
                              >
                                {alert.status}
                              </Badge>
                            </div>
                            
                            {summary && (
                              <p className="text-sm text-slate-700 mb-2 flex items-start gap-2">
                                <Sparkles className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />
                                <span className="italic">{summary.summary}</span>
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {alert.address_text || `${alert.city}, ${alert.state}`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(alert.received_at).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              {alert.severity && (
                                <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs h-5">
                                  {alert.severity}
                                </Badge>
                              )}
                              {alert.confidence && (
                                <span className="text-slate-500">
                                  {Math.round(alert.confidence * 100)}% confident
                                </span>
                              )}
                              <span className="text-slate-400">
                                {alert.source}
                              </span>
                            </div>
                            
                            {summary?.keyDetails && summary.keyDetails.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {summary.keyDetails.map((detail, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {detail}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleAlertClick(alert); 
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <FireAlertDrawer
        alert={selectedAlert}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
      />

      <AddTestAlertDialog
        open={showTestDialog}
        onClose={() => setShowTestDialog(false)}
        user={user}
      />
    </div>
  );
}