import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Mail, FileText, Printer, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { HUMAN_STATUSES } from '@/components/job/JobConstants';

export default function JobDocumentCenter({ job, user }) {
    const [loading, setLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState("");
    const [activeTab, setActiveTab] = useState("email");
    
    // State for inputs
    const [emailType, setEmailType] = useState("status_update");
    const [docType, setDocType] = useState("change_order");
    const [reportType, setReportType] = useState("client_summary");
    const [customInput, setCustomInput] = useState("");

    const generateContent = async () => {
        setLoading(true);
        setGeneratedContent("");
        try {
            let prompt = "";
            let systemRole = "You are a professional assistant for a restoration company.";

            if (activeTab === "email") {
                systemRole += " You draft clear, reassuring emails to homeowners.";
                prompt = `
                    Draft a ${emailType.replace('_', ' ')} email for the homeowner (${job.property_owner_name}).
                    Job Address: ${job.property_address_line1}, ${job.property_city}.
                    Current Status: ${HUMAN_STATUSES[job.current_status]}.
                    Additional Context/Key Message: ${customInput || "Standard update based on status."}
                    
                    Return ONLY the email body text (no subject line needed in body, or put Subject: at top).
                `;
            } else if (activeTab === "legal") {
                systemRole += " You generate formal legal documents for construction/restoration.";
                prompt = `
                    Generate a formal ${docType.replace('_', ' ')} document for this job.
                    Job: ${job.property_owner_name} at ${job.property_address_line1}.
                    Details/Scope: ${customInput || "No specific details provided."}
                    
                    Format as a clean, professional document with headers.
                `;
            } else if (activeTab === "reports") {
                systemRole += " You create comprehensive summary reports.";
                prompt = `
                    Create a ${reportType.replace('_', ' ')} report for this job.
                    Include:
                    - Job Details: ${job.property_owner_name}, ${job.property_address_line1}
                    - Status: ${HUMAN_STATUSES[job.current_status]}
                    - Financials: Total Invoice ${job.total_invoice_amount || 0}, Paid ${job.total_payments_received || 0}
                    - Key Notes/Summary: ${customInput || "General progress summary."}
                    
                    Structure with clear sections.
                `;
            }

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `${systemRole}\n\nTask: ${prompt}`,
                // We want plain text/markdown back, not JSON, for flexibility in document structure
            });

            setGeneratedContent(response);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate content");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedContent);
        toast.success("Copied to clipboard");
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Job Document - ${job.property_owner_name}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
                    h1, h2, h3 { color: #333; }
                    pre { white-space: pre-wrap; font-family: sans-serif; }
                </style>
            </head>
            <body>
                <pre>${generatedContent}</pre>
                <script>window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    AI Document Center
                </CardTitle>
                <CardDescription>Generate emails, legal docs, and reports instantly.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="email">Email Updates</TabsTrigger>
                        <TabsTrigger value="legal">Legal & Change Orders</TabsTrigger>
                        <TabsTrigger value="reports">Summary Reports</TabsTrigger>
                    </TabsList>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Inputs Column */}
                        <div className="space-y-4">
                            {activeTab === "email" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Email Type</Label>
                                        <Select value={emailType} onValueChange={setEmailType}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="status_update">Status Update</SelectItem>
                                                <SelectItem value="check_in">Weekly Check-in</SelectItem>
                                                <SelectItem value="delay_notice">Delay Notification</SelectItem>
                                                <SelectItem value="completion_notice">Completion Notice</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Key Message / Context</Label>
                                        <Textarea 
                                            placeholder="E.g., Waiting on insurance approval..." 
                                            value={customInput}
                                            onChange={e => setCustomInput(e.target.value)}
                                            className="h-32"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === "legal" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Document Type</Label>
                                        <Select value={docType} onValueChange={setDocType}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="change_order">Change Order</SelectItem>
                                                <SelectItem value="addendum">Contract Addendum</SelectItem>
                                                <SelectItem value="scope_of_work">Scope of Work</SelectItem>
                                                <SelectItem value="work_authorization">Work Authorization</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Details & Scope Changes</Label>
                                        <Textarea 
                                            placeholder="Describe the changes, costs, or new scope details..." 
                                            value={customInput}
                                            onChange={e => setCustomInput(e.target.value)}
                                            className="h-32"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === "reports" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Report Type</Label>
                                        <Select value={reportType} onValueChange={setReportType}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="client_summary">Client Progress Summary</SelectItem>
                                                <SelectItem value="adjuster_report">Adjuster/Insurance Report</SelectItem>
                                                <SelectItem value="internal_review">Internal Team Review</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Specific Focus (Optional)</Label>
                                        <Textarea 
                                            placeholder="E.g., Focus on mitigation timeline..." 
                                            value={customInput}
                                            onChange={e => setCustomInput(e.target.value)}
                                            className="h-32"
                                        />
                                    </div>
                                </div>
                            )}

                            <Button onClick={generateContent} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Generate {activeTab === 'email' ? 'Draft' : 'Document'}
                            </Button>
                        </div>

                        {/* Output Column */}
                        <div className="md:col-span-2">
                            <div className="border rounded-lg bg-white p-4 min-h-[300px] relative shadow-sm">
                                {!generatedContent ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                        <div className="text-center">
                                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p>Generated content will appear here</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="whitespace-pre-wrap font-mono text-sm text-slate-800 mb-12">
                                            {generatedContent}
                                        </div>
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <Button variant="outline" size="sm" onClick={copyToClipboard}>
                                                <Copy className="w-4 h-4 mr-2" /> Copy
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                                <Printer className="w-4 h-4 mr-2" /> Print/PDF
                                            </Button>
                                            {activeTab === 'email' && (
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => {
                                                    window.location.href = `mailto:${job.property_email || ''}?subject=Update regarding your property&body=${encodeURIComponent(generatedContent)}`;
                                                }}>
                                                    <Mail className="w-4 h-4 mr-2" /> Send
                                                </Button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
}