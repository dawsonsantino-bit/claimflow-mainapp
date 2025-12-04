import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { HUMAN_STATUSES } from '@/components/job/JobConstants';

export default function JobAIInsights({ job, history }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = `
        Analyze the following job details and history for a property restoration claim.
        
        Job Details:
        - Owner: ${job.property_owner_name}
        - Address: ${job.property_address_line1}, ${job.property_city}
        - Loss Type: ${job.loss_type}
        - Current Status: ${HUMAN_STATUSES[job.current_status] || job.current_status}
        - Created: ${job.lead_created_at}
        
        History:
        ${history?.map(h => `- ${h.changed_at}: Changed to ${h.to_status} (Note: ${h.note || 'None'})`).join('\n')}
        
        Provide a JSON response with the following keys:
        1. "summary": A concise narrative summary of the job history and status.
        2. "suggested_actions": An array of strings suggesting initial responses or follow-up actions for the Sales Rep.
        3. "potential_issues": An array of strings identifying potential issues or critical next steps.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            suggested_actions: { type: "array", items: { type: "string" } },
            potential_issues: { type: "array", items: { type: "string" } }
          },
          required: ["summary", "suggested_actions", "potential_issues"]
        }
      });

      setInsights(response);
    } catch (err) {
      console.error("Failed to generate insights", err);
      setError("Failed to generate AI insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-indigo-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI Case Analysis
          </CardTitle>
          {!insights && !loading && (
            <Button 
              onClick={generateInsights} 
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Insights
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
            <p className="text-sm">Analyzing case details...</p>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {insights && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-2">Case Summary</h4>
              <p className="text-slate-700 text-sm leading-relaxed bg-white/60 p-3 rounded-lg border border-indigo-100">
                {insights.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Suggested Actions
                </h4>
                <ul className="space-y-2">
                  {insights.suggested_actions.map((action, idx) => (
                    <li key={idx} className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-100 flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 text-indigo-400 mt-1 shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Critical Next Steps
                </h4>
                <ul className="space-y-2">
                  {insights.potential_issues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-100 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={generateInsights}
                  className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                >
                    <RefreshCw className="w-3 h-3 mr-1" /> Refresh Analysis
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper for refresh icon since I used it but didn't import it
import { RefreshCw } from 'lucide-react';