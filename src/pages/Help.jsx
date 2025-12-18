import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, MessageCircle, HelpCircle, Flame, Users, FileText, DollarSign } from 'lucide-react';

const faqCategories = {
  'Getting Started': {
    icon: <BookOpen className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-700',
    faqs: [
      {
        q: 'How do I create my first job?',
        a: 'Navigate to the Jobs page and click the "New Job" button. Fill in the homeowner details, property information, and loss type. The system will automatically generate a claim number and track your job through each workflow stage.'
      },
      {
        q: 'What are the different user roles?',
        a: 'CaseManager supports 7 roles: CompanyAdmin (full access), LocationAdmin (location-specific), SalesRep (lead conversion & jobs), Hygienist (swab testing), Attorney (negotiations), Contractor (work completion), and Homeowner (view-only access to their jobs).'
      },
      {
        q: 'How do I invite new users?',
        a: 'As a CompanyAdmin, go to the Users page and click "Add User". Enter their email, name, and role. If SMTP is configured, they\'ll receive an invitation email. Otherwise, you\'ll get a temporary password to share with them.'
      }
    ]
  },
  'Fire Alerts': {
    icon: <Flame className="w-5 h-5" />,
    color: 'bg-red-100 text-red-700',
    faqs: [
      {
        q: 'How do fire alerts work?',
        a: 'Fire alerts are automatically ingested from integrated providers (FireHub, EmergencyNet, etc.). The system uses AI to analyze severity, confidence, and urgency. You can review alerts on the Fires page, schedule visits, and convert them into leads.'
      },
      {
        q: 'What is urgency scoring?',
        a: 'AI calculates an urgency score (0-100) based on time sensitivity, business potential, confidence level, property type, and competition risk. Critical/high urgency alerts are highlighted at the top for immediate action.'
      },
      {
        q: 'How do I convert an alert to a lead?',
        a: 'Click on any alert to open the details drawer. Review the AI-powered lead qualification analysis, then click "Convert to Lead". Fill in homeowner details and the system creates a new job with all alert information pre-populated.'
      },
      {
        q: 'What does AI duplicate clustering do?',
        a: 'The system detects when multiple alerts report the same fire incident. It clusters duplicates together, marks older ones as "Stale", and merges details into a single primary alert for cleaner workflow.'
      }
    ]
  },
  'Job Management': {
    icon: <FileText className="w-5 h-5" />,
    color: 'bg-green-100 text-green-700',
    faqs: [
      {
        q: 'What are the job workflow stages?',
        a: 'Jobs progress through 14 stages: Lead Created → Assessment → Contract Signed → Documentation → Hygienist Assigned → Lab Testing → Protocol Ready → Insurance Negotiation → Payment Received → Work In Progress → Work Completed → Final Settlement → Contractor Paid → Case Closed.'
      },
      {
        q: 'How do I update job status?',
        a: 'Open any job detail page. The status workflow is shown at the top. Click on any available next step to advance the job. The system tracks timestamps, updates the homeowner automatically, and creates an audit trail.'
      },
      {
        q: 'Can homeowners see job updates?',
        a: 'Yes! Homeowners have read-only access to their jobs. They can view the timeline, photos marked as visible, and updates sent to them. This keeps them informed without giving edit access.'
      },
      {
        q: 'How do I assign team members?',
        a: 'On the job detail page, use the "Team" section to assign Sales Rep, Hygienist, Attorney, and Contractor. Each role has specific permissions and sees relevant workflow steps.'
      }
    ]
  },
  'Insurance & Payments': {
    icon: <DollarSign className="w-5 h-5" />,
    color: 'bg-amber-100 text-amber-700',
    faqs: [
      {
        q: 'How do I track insurance negotiations?',
        a: 'Open a job and go to the "Negotiations" tab. Record offers, counters, denials, and notes. Upload supporting documents. The system maintains a chronological history of all negotiation activities.'
      },
      {
        q: 'How do I record payments?',
        a: 'In the "Financials" tab of a job, click "Record Payment". Enter payer type (Insurance, Homeowner, Attorney, Other), amount, payment method, and date. The system tracks total payments and outstanding balances.'
      },
      {
        q: 'What happens when insurance pays?',
        a: 'When you record an insurance payment, the job status can advance to "Insurance Paid (First Check)". This triggers notifications and allows you to begin work. Record additional payments as they arrive.'
      }
    ]
  },
  'User Management': {
    icon: <Users className="w-5 h-5" />,
    color: 'bg-purple-100 text-purple-700',
    faqs: [
      {
        q: 'How do I suspend a user?',
        a: 'Go to Users page, find the user, and click "Suspend". Suspended users cannot log in and will receive a 403 error. Click "Enable" to restore access. You cannot suspend yourself.'
      },
      {
        q: 'How do I reset a user\'s password?',
        a: 'Click "Reset Password" on any user row. The system generates a temporary password and displays it in a copyable dialog. Share this password with the user securely.'
      },
      {
        q: 'Can I change a user\'s role after creation?',
        a: 'Yes! Use the role dropdown in the user table to change any user\'s role. This immediately updates their access and dashboard. All changes are logged in the audit trail.'
      }
    ]
  },
  'Troubleshooting': {
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'bg-slate-100 text-slate-700',
    faqs: [
      {
        q: 'Why can\'t I see certain jobs?',
        a: 'Your role determines what you can see. SalesReps see their own jobs, LocationAdmins see their location, CompanyAdmins see everything. Homeowners only see jobs where they\'re listed as the property owner.'
      },
      {
        q: 'What are backend functions?',
        a: 'Backend functions enable advanced features like server-side role enforcement, rate limiting, SMTP email sending, and OAuth integrations. Enable them in app Settings for full functionality.'
      },
      {
        q: 'How do I restart the onboarding tour?',
        a: 'Coming soon! For now, contact your admin to reset your onboarding status. The tour will automatically show for new users on first login.'
      }
    ]
  }
};

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');

  const allFaqs = Object.entries(faqCategories).flatMap(([category, data]) =>
    data.faqs.map(faq => ({ ...faq, category, icon: data.icon, color: data.color }))
  );

  const filteredFaqs = searchQuery
    ? allFaqs.filter(faq =>
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Help Center</h1>
        <p className="text-slate-600">Find answers to common questions and learn how to use CaseManager</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Restart Tour</h3>
                <p className="text-sm text-slate-600">Take the guided tour again to refresh your knowledge</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-600 p-3 rounded-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Contact Support</h3>
                <p className="text-sm text-slate-600">Need more help? Reach out to our support team</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      {searchQuery && filteredFaqs ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Search Results ({filteredFaqs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-2">
                {filteredFaqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`search-${idx}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3">
                        <Badge className={faq.color}>{faq.icon}</Badge>
                        <span>{faq.q}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 pl-12">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Search className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No results found for "{searchQuery}"</p>
                <p className="text-sm">Try different keywords or browse categories below</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        Object.entries(faqCategories).map(([category, { icon, color, faqs }]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Badge className={`${color} p-2`}>{icon}</Badge>
                <span>{category}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`${category}-${idx}`}>
                    <AccordionTrigger className="text-left font-medium">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}