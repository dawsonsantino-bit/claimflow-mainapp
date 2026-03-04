import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Check, Circle, Clock, AlertCircle, Image, FileText, User,
  MapPin, Phone, Mail, Activity, Sparkles, ShieldCheck,
  ChevronRight, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_JOB = {
  claim_number: 12,
  property_owner_name: 'John Smith',
  property_email: 'homeowner@demo.com',
  property_phone: '(555) 555-5555',
  property_address_line1: '101 Main St',
  property_city: 'Austin',
  property_state: 'TX',
  property_zip: '78701',
  loss_type: 'Fire and Smoke',
  current_status: 'InsuranceNegotiation',
  insurance_company: 'SafeGuard Insurance',
  insurance_adjuster_name: 'Maria Lopez',
  job_total_value: 87500,
  insurance_approved_amount: 72000,
  initial_check_amount: 36000,
  swab_result: 'Hot',
  hygienist_scheduled_window: '9am–12pm',
};

const SAMPLE_JOBS = [
  { claim_number: 11, property_owner_name: 'Emily Carter', address: '244 Oak Ave, Dallas, TX', loss_type: 'Fire', current_status: 'WorkInProgress', total: '$52,000' },
  { claim_number: 12, property_owner_name: 'John Smith', address: '101 Main St, Austin, TX', loss_type: 'Fire and Smoke', current_status: 'InsuranceNegotiation', total: '$87,500' },
  { claim_number: 13, property_owner_name: 'Marco Reyes', address: '88 Pine Rd, Houston, TX', loss_type: 'Smoke', current_status: 'ContractSigned', total: '$34,200' },
];

const SAMPLE_UPDATES = [
  { date: '2026-02-28', text: 'Insurance adjuster Maria Lopez confirmed receipt of the protocol. Negotiation phase has begun.', ai: false },
  { date: '2026-02-21', text: 'Lab results confirmed contamination (Hot). Protocol document uploaded and submitted to insurance.', ai: true },
  { date: '2026-02-14', text: 'Hygienist completed swab collection at the property. Samples sent to lab for analysis.', ai: false },
  { date: '2026-02-07', text: 'Contract signed by homeowner. Hygienist appointment scheduled for Feb 14, 9am–12pm.', ai: false },
  { date: '2026-01-30', text: 'Initial assessment completed. Fire and smoke damage confirmed throughout kitchen and main hallway.', ai: false },
];

const PLACEHOLDER_PHOTOS = [
  { label: 'Kitchen – Before', type: 'Before', color: 'bg-orange-100' },
  { label: 'Hallway – Before', type: 'Before', color: 'bg-orange-100' },
  { label: 'Kitchen – During', type: 'During', color: 'bg-blue-100' },
  { label: 'Swab Site #1', type: 'Swab', color: 'bg-purple-100' },
  { label: 'Swab Site #2', type: 'Swab', color: 'bg-purple-100' },
  { label: 'Hallway – After', type: 'After', color: 'bg-green-100' },
];

const STEPS = [
  { key: 'LeadCreated', label: 'Lead Created' },
  { key: 'AssessmentDone', label: 'Assessment Complete' },
  { key: 'ContractSigned', label: 'Contract Signed' },
  { key: 'InitialDocumentationComplete', label: 'Documentation Complete' },
  { key: 'HygienistAssigned', label: 'Hygienist Assigned' },
  { key: 'SwabCompletedLabSent', label: 'Swab Sent to Lab' },
  { key: 'LabResultsProtocolReady', label: 'Protocol Ready' },
  { key: 'InsuranceNegotiation', label: 'In Negotiation' },
  { key: 'InsurancePaidFirstCheck', label: 'Initial Payment' },
  { key: 'WorkInProgress', label: 'Work In Progress' },
  { key: 'WorkCompleted', label: 'Work Completed' },
  { key: 'FinalCheckToAttorney', label: 'Final Settlement' },
  { key: 'ContractorPaidCaseClosed', label: 'Case Closed' },
];

const STATUS_COLORS = {
  InsuranceNegotiation: 'bg-amber-100 text-amber-700',
  WorkInProgress: 'bg-blue-100 text-blue-700',
  ContractSigned: 'bg-indigo-100 text-indigo-700',
  ContractorPaidCaseClosed: 'bg-green-100 text-green-700',
};

const STATUS_LABELS = {
  InsuranceNegotiation: 'In Negotiation',
  WorkInProgress: 'Work In Progress',
  ContractSigned: 'Contract Signed',
  ContractorPaidCaseClosed: 'Case Closed',
};

// ─── Sub-components ─────────────────────────────────────────────────────────────
function DemoWorkflow({ currentStatus }) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStatus);
  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="min-w-[900px] flex items-center justify-between px-4 relative">
        <div className="absolute left-0 top-4 w-full h-0.5 bg-slate-200 -z-0" />
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1 relative z-10">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white",
                done ? "border-green-500 text-green-500" :
                current ? "border-blue-600 text-blue-600 ring-4 ring-blue-100" :
                "border-slate-300 text-slate-300"
              )}>
                {done ? <Check className="w-4 h-4" /> : current ? <Clock className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
              </div>
              <span className={cn(
                "text-[10px] font-medium text-center max-w-[72px] mt-1",
                current ? "text-blue-600" : done ? "text-slate-700" : "text-slate-400"
              )}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhotoPlaceholder({ label, type, color }) {
  return (
    <div className={`${color} rounded-lg aspect-square flex flex-col items-center justify-center gap-2 border border-white/50`}>
      <Image className="w-6 h-6 text-slate-500 opacity-60" />
      <span className="text-xs font-medium text-slate-600 text-center px-2">{label}</span>
      <Badge variant="outline" className="text-[10px]">{type}</Badge>
    </div>
  );
}

function DemoJobDetailModal({ job, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{job.property_owner_name}</h2>
              <p className="text-slate-500 text-sm">{job.property_address_line1}, {job.property_city}, {job.property_state} {job.property_zip}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          </div>
          <DemoWorkflow currentStatus={job.current_status} />
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Loss Type', val: job.loss_type },
              { label: 'Insurance', val: job.insurance_company },
              { label: 'Adjuster', val: job.insurance_adjuster_name },
              { label: 'Swab Result', val: job.swab_result },
              { label: 'Job Total', val: `$${Number(job.job_total_value).toLocaleString()}` },
              { label: 'Approved', val: `$${Number(job.insurance_approved_amount).toLocaleString()}` },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                <p className="font-medium text-slate-800">{item.val || '—'}</p>
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 mb-2 text-sm">Recent Updates</h3>
            <div className="space-y-2">
              {SAMPLE_UPDATES.slice(0, 2).map((u, i) => (
                <div key={i} className="text-sm bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">{u.date}</p>
                  <p className="text-slate-700">{u.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Admin View ─────────────────────────────────────────────────────────────
function AdminView() {
  const [modalJob, setModalJob] = useState(null);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">All Jobs — Company Overview</h2>
          <p className="text-sm text-slate-500">Demo company · 3 active claims</p>
        </div>
        <Button disabled className="opacity-60 cursor-not-allowed" title="Demo mode: disabled">+ New Job</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">#</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Owner</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Address</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Loss Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {SAMPLE_JOBS.map(j => (
                <tr key={j.claim_number} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-600">#{j.claim_number}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{j.property_owner_name}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{j.address}</td>
                  <td className="px-4 py-3 text-slate-600">{j.loss_type}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs", STATUS_COLORS[j.current_status] || 'bg-slate-100 text-slate-600')}>
                      {STATUS_LABELS[j.current_status] || j.current_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-700 hidden md:table-cell">{j.total}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm" variant="outline"
                      onClick={() => setModalJob(SAMPLE_JOB)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Jobs', val: '3' },
          { label: 'In Negotiation', val: '1' },
          { label: 'Total Pipeline', val: '$173,700' },
          { label: 'Closed This Month', val: '0' },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-2xl font-bold text-slate-900">{item.val}</p>
              <p className="text-xs text-slate-500 mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {modalJob && <DemoJobDetailModal job={modalJob} onClose={() => setModalJob(null)} />}
    </div>
  );
}

// ─── Tab: Sales Rep View ─────────────────────────────────────────────────────────
function SalesRepView() {
  const [modalJob, setModalJob] = useState(null);
  const myJobs = SAMPLE_JOBS.slice(0, 2);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">My Pipeline</h2>
        <p className="text-sm text-slate-500">2 active jobs assigned to you</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myJobs.map(j => (
          <Card key={j.claim_number} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setModalJob(SAMPLE_JOB)}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{j.property_owner_name}</p>
                  <p className="text-xs text-slate-500">{j.address}</p>
                </div>
                <Badge className={cn("text-xs shrink-0", STATUS_COLORS[j.current_status] || 'bg-slate-100 text-slate-600')}>
                  {STATUS_LABELS[j.current_status] || j.current_status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{j.loss_type}</span>
                <span className="font-medium text-slate-700">{j.total}</span>
              </div>
              <Button size="sm" variant="ghost" className="mt-3 w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                Open Job <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-slate-300 bg-slate-50/50">
        <CardHeader>
          <CardTitle className="text-base">New Job Form Preview</CardTitle>
          <CardDescription className="text-xs">Demo mode — form is visible but submission is disabled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Property Owner Name', placeholder: 'John Smith' },
              { label: 'Phone', placeholder: '(555) 555-5555' },
              { label: 'Address', placeholder: '101 Main St' },
              { label: 'City', placeholder: 'Austin' },
              { label: 'State', placeholder: 'TX' },
              { label: 'ZIP', placeholder: '78701' },
            ].map(f => (
              <div key={f.label} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input placeholder={f.placeholder} disabled className="bg-white" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button disabled className="opacity-50 cursor-not-allowed">Create Job</Button>
            <span className="text-xs text-amber-600 font-medium">⚠ Demo mode: submission disabled</span>
          </div>
        </CardContent>
      </Card>

      {modalJob && <DemoJobDetailModal job={modalJob} onClose={() => setModalJob(null)} />}
    </div>
  );
}

// ─── Tab: Homeowner View ─────────────────────────────────────────────────────────
function HomeownerView() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center pb-2">
        <h2 className="text-lg font-bold text-slate-900">Welcome, John Smith</h2>
        <p className="text-sm text-slate-500">101 Main St, Austin, TX · Claim #12</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Your Claim Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <DemoWorkflow currentStatus={SAMPLE_JOB.current_status} />
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Current Stage:</strong> In Negotiation — Our team is actively negotiating with your insurance company.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SAMPLE_UPDATES.map((u, i) => (
            <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400">{new Date(u.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  {u.ai && (
                    <Badge className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-200 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> AI
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-700">{u.text}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {PLACEHOLDER_PHOTOS.map((p, i) => (
              <PhotoPlaceholder key={i} {...p} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Demo Page ──────────────────────────────────────────────────────────────
export default function Demo() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Demo banner */}
      <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium sticky top-0 z-50">
        🎭 Demo Mode — Sample data only. No login required. No real data is accessed or modified.
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-slate-900 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ClaimFlow — Interactive Demo</h1>
            <p className="text-slate-500 text-sm">Explore the platform from every perspective. All data is fictional.</p>
          </div>
          <div className="ml-auto hidden md:flex">
            <Button onClick={() => window.location.href = '/'} variant="outline" className="border-slate-300">
              Sign In to Real Account
            </Button>
          </div>
        </div>

        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="admin">🏢 Admin View</TabsTrigger>
            <TabsTrigger value="salesrep">👤 Sales Rep View</TabsTrigger>
            <TabsTrigger value="homeowner">🏠 Homeowner View</TabsTrigger>
          </TabsList>

          <TabsContent value="admin">
            <AdminView />
          </TabsContent>
          <TabsContent value="salesrep">
            <SalesRepView />
          </TabsContent>
          <TabsContent value="homeowner">
            <HomeownerView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}