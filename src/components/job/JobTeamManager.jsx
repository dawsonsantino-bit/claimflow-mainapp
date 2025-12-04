import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Users, Save, X, UserCheck } from 'lucide-react';
import { USER_ROLES } from '@/components/job/JobConstants';
import { toast } from 'sonner';
import { NotificationService } from '@/components/services/NotificationService';

export default function JobTeamManager({ job, user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [assignments, setAssignments] = useState({});
  const [aiThinking, setAiThinking] = useState(false);
  const queryClient = useQueryClient();

  // 1. Fetch all users in the company
  const { data: companyUsers } = useQuery({
    queryKey: ['companyUsers', user.company_id],
    queryFn: () => base44.entities.User.list({ company_id: user.company_id }),
    enabled: !!user.company_id
  });

  // 2. Fetch active jobs to calculate workload
  const { data: activeJobs } = useQuery({
    queryKey: ['activeJobsWorkload', user.company_id],
    queryFn: () => base44.entities.Job.list({ 
        company_id: user.company_id,
        current_status: { $ne: 'ContractorPaidCaseClosed' } // Approximation of active
    }),
    enabled: !!user.company_id
  });

  // 3. Process candidates and workload
  const candidates = useMemo(() => {
    if (!companyUsers) return {};
    
    const workload = {};
    if (activeJobs) {
        activeJobs.forEach(j => {
            ['sales_rep_user_id', 'hygienist_user_id', 'attorney_user_id', 'contractor_user_id'].forEach(roleKey => {
                const uid = j[roleKey];
                if (uid) workload[uid] = (workload[uid] || 0) + 1;
            });
        });
    }

    const grouped = {
        [USER_ROLES.SalesRep]: [],
        [USER_ROLES.Hygienist]: [],
        [USER_ROLES.Attorney]: [],
        [USER_ROLES.Contractor]: []
    };

    companyUsers.forEach(u => {
        if (grouped[u.business_role]) {
            grouped[u.business_role].push({
                ...u,
                workload: workload[u.id] || 0
            });
        }
    });

    return grouped;
  }, [companyUsers, activeJobs]);

  // Initialize assignments state when editing starts
  const startEditing = () => {
    setAssignments({
        sales_rep_user_id: job.sales_rep_user_id,
        hygienist_user_id: job.hygienist_user_id,
        attorney_user_id: job.attorney_user_id,
        contractor_user_id: job.contractor_user_id
    });
    setIsEditing(true);
  };

  const handleAiSuggest = async () => {
    setAiThinking(true);
    try {
        // Construct prompt context
        const context = {
            job: {
                city: job.property_city,
                loss_type: job.loss_type,
                address: job.property_address_line1
            },
            candidates: {
                SalesRep: candidates[USER_ROLES.SalesRep]?.map(u => ({ id: u.id, name: u.full_name, workload: u.workload })),
                Hygienist: candidates[USER_ROLES.Hygienist]?.map(u => ({ id: u.id, name: u.full_name, workload: u.workload })),
                Attorney: candidates[USER_ROLES.Attorney]?.map(u => ({ id: u.id, name: u.full_name, workload: u.workload })),
                Contractor: candidates[USER_ROLES.Contractor]?.map(u => ({ id: u.id, name: u.full_name, workload: u.workload })),
            }
        };

        const prompt = `
            Suggest the best team assignment for this job based on workload balancing (prefer lower workload) and simple location proximity matching (if names imply location, otherwise random).
            
            Job Context: ${JSON.stringify(context.job)}
            
            Candidates: ${JSON.stringify(context.candidates)}
            
            Return a JSON object with suggested user_ids for: sales_rep_user_id, hygienist_user_id, attorney_user_id, contractor_user_id.
            Only suggest for roles that have candidates. If a role has no candidates, return null for it.
        `;

        const suggestion = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    sales_rep_user_id: { type: ["string", "null"] },
                    hygienist_user_id: { type: ["string", "null"] },
                    attorney_user_id: { type: ["string", "null"] },
                    contractor_user_id: { type: ["string", "null"] }
                }
            }
        });

        setAssignments(prev => ({
            ...prev,
            ...suggestion
        }));
        
        toast.success("AI suggestions applied! Review and save.");

    } catch (error) {
        console.error("AI Suggestion failed", error);
        toast.error("Failed to get suggestions");
    } finally {
        setAiThinking(false);
    }
  };

  const handleSave = async () => {
    try {
        await base44.entities.Job.update(job.id, assignments);
        
        // Check for new assignments and notify
        Object.keys(assignments).forEach(key => {
            const newId = assignments[key];
            const oldId = job[key];
            if (newId && newId !== oldId) {
                // Map key to role name
                const roleMap = {
                    sales_rep_user_id: 'Sales Rep',
                    hygienist_user_id: 'Hygienist',
                    attorney_user_id: 'Attorney',
                    contractor_user_id: 'Contractor'
                };
                NotificationService.notifyAssignment(job, roleMap[key], newId, user.id);
            }
        });

        await queryClient.invalidateQueries({ queryKey: ['job', job.id] });
        setIsEditing(false);
        toast.success("Team assignments updated");
    } catch (error) {
        toast.error("Failed to save assignments");
    }
  };

  const RoleSelector = ({ label, roleKey, roleType }) => {
    const roleCandidates = candidates[roleType] || [];
    const currentId = isEditing ? assignments[roleKey] : job[roleKey];
    // Helper to find name for display mode
    const assignedUser = companyUsers?.find(u => u.id === currentId);

    if (!isEditing) {
        return (
            <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">{label}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                            {assignedUser ? assignedUser.full_name : 'Pending Assignment'}
                        </span>
                        {assignedUser && (
                           <Badge variant="outline" className="text-[10px] h-4 px-1">
                               {activeJobs ? (activeJobs.filter(j => j[roleKey] === assignedUser.id).length) : '?'} Active Jobs
                           </Badge>
                        )}
                    </div>
                </div>
                <UserCheck className={`w-4 h-4 ${assignedUser ? 'text-green-500' : 'text-slate-300'}`} />
            </div>
        );
    }

    return (
        <div className="space-y-1.5 mb-3">
            <label className="text-xs font-medium text-slate-500 uppercase">{label}</label>
            <Select 
                value={assignments[roleKey] || "unassigned"} 
                onValueChange={(val) => setAssignments(prev => ({ ...prev, [roleKey]: val === "unassigned" ? null : val }))}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select member..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {roleCandidates.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center justify-between w-full gap-2">
                                <span>{c.full_name}</span>
                                <span className="text-xs text-slate-400">({c.workload} active)</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Assignments
            </CardTitle>
            {(user.business_role === 'CompanyAdmin' || user.business_role === 'LocationAdmin') && (
                !isEditing ? (
                    <Button variant="ghost" size="sm" onClick={startEditing} className="h-8 text-xs">
                        Edit / Assign
                    </Button>
                ) : (
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )
            )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing && (
            <div className="mb-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-indigo-900">AI Auto-Assign</p>
                        <p className="text-xs text-indigo-600">Suggest based on workload & location</p>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={handleAiSuggest} 
                        disabled={aiThinking}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                        {aiThinking ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                        Suggest
                    </Button>
                </div>
            </div>
        )}

        <div className="space-y-1">
            <RoleSelector label="Sales Rep" roleKey="sales_rep_user_id" roleType={USER_ROLES.SalesRep} />
            <RoleSelector label="Hygienist" roleKey="hygienist_user_id" roleType={USER_ROLES.Hygienist} />
            <RoleSelector label="Attorney" roleKey="attorney_user_id" roleType={USER_ROLES.Attorney} />
            <RoleSelector label="Contractor" roleKey="contractor_user_id" roleType={USER_ROLES.Contractor} />
        </div>

        {isEditing && (
            <Button onClick={handleSave} className="w-full mt-4">
                <Save className="w-4 h-4 mr-2" /> Save Assignments
            </Button>
        )}
      </CardContent>
    </Card>
  );
}