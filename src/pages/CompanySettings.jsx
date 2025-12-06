import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { USER_ROLES } from '@/components/job/JobConstants';

export default function CompanySettings() {
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Local state for form
    const [companyName, setCompanyName] = useState("");
    const [lossTypes, setLossTypes] = useState([]);
    const [insuranceProviders, setInsuranceProviders] = useState([]);

    const [newLossType, setNewLossType] = useState("");
    const [newProvider, setNewProvider] = useState("");

    useEffect(() => {
        base44.auth.me().then(setUser).catch(() => {});
    }, []);

    const { data: company, isLoading: isCompanyLoading } = useQuery({
        queryKey: ['company', user?.company_id],
        queryFn: async () => {
            if (!user?.company_id) return null;
            const res = await base44.entities.Company.filter({ id: user.company_id });
            return res?.[0] || null;
        },
        enabled: !!user?.company_id
    });

    useEffect(() => {
        if (company) {
            setCompanyName(company.name || "");
            setLossTypes(company.supported_loss_types || ["Fire", "Smoke", "Fire and Smoke"]);
            setInsuranceProviders(company.preferred_insurance_providers || []);
        }
    }, [company]);

    const handleSave = async () => {
        if (!company) return;
        setIsSaving(true);
        try {
            await base44.entities.Company.update(company.id, {
                name: companyName,
                supported_loss_types: lossTypes,
                preferred_insurance_providers: insuranceProviders
            });
            toast.success("Company settings updated");
            queryClient.invalidateQueries(['company']);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    const addLossType = () => {
        if (!newLossType.trim()) return;
        if (lossTypes.includes(newLossType.trim())) {
            toast.error("Type already exists");
            return;
        }
        setLossTypes([...lossTypes, newLossType.trim()]);
        setNewLossType("");
    };

    const removeLossType = (type) => {
        setLossTypes(lossTypes.filter(t => t !== type));
    };

    const addProvider = () => {
        if (!newProvider.trim()) return;
        if (insuranceProviders.includes(newProvider.trim())) {
            toast.error("Provider already exists");
            return;
        }
        setInsuranceProviders([...insuranceProviders, newProvider.trim()]);
        setNewProvider("");
    };

    const removeProvider = (p) => {
        setInsuranceProviders(insuranceProviders.filter(ip => ip !== p));
    };

    if (isCompanyLoading || !user) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    }

    if (user.business_role !== USER_ROLES.CompanyAdmin) {
        return <div className="p-8 text-red-600">Access Denied. Company Admin only.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Company Settings</h1>
                    <p className="text-slate-500">Manage your company configuration.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                            <CardDescription>Basic company details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Company Name</label>
                                <Input 
                                    value={companyName} 
                                    onChange={(e) => setCompanyName(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slug (ID)</label>
                                <Input 
                                    value={company?.slug || ''} 
                                    disabled 
                                    className="bg-slate-100 text-slate-500"
                                />
                                <p className="text-xs text-slate-400">Used for system identification. Cannot be changed.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="configuration" className="space-y-6">
                    {/* Loss Types */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Default Loss Types</CardTitle>
                            <CardDescription>Manage the types of losses available when creating a new job.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Add new type (e.g. Water Damage)" 
                                    value={newLossType}
                                    onChange={(e) => setNewLossType(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addLossType()}
                                />
                                <Button variant="outline" onClick={addLossType}><Plus className="w-4 h-4" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {lossTypes.map((type) => (
                                    <div key={type} className="bg-slate-100 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                                        <span>{type}</span>
                                        <button onClick={() => removeLossType(type)} className="text-slate-400 hover:text-red-500">
                                            <XIcon />
                                        </button>
                                    </div>
                                ))}
                                {lossTypes.length === 0 && <p className="text-sm text-slate-400 italic">No types defined.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance Providers */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Insurance Providers</CardTitle>
                            <CardDescription>Define a list of preferred insurance providers for quick selection.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Add provider (e.g. State Farm)" 
                                    value={newProvider}
                                    onChange={(e) => setNewProvider(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addProvider()}
                                />
                                <Button variant="outline" onClick={addProvider}><Plus className="w-4 h-4" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {insuranceProviders.map((p) => (
                                    <div key={p} className="bg-slate-100 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                                        <span>{p}</span>
                                        <button onClick={() => removeProvider(p)} className="text-slate-400 hover:text-red-500">
                                            <XIcon />
                                        </button>
                                    </div>
                                ))}
                                {insuranceProviders.length === 0 && <p className="text-sm text-slate-400 italic">No providers defined.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function XIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
    )
}