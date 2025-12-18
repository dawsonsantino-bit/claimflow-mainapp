import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { HUMAN_STATUSES } from '@/components/job/JobConstants';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your CaseManager AI assistant. I can help you with:\n\n• Login and account issues\n• Checking job status (with claim ID)\n• General app guidance\n• Troubleshooting\n\nHow can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Check if user is asking about a specific claim ID (5 char alphanumeric)
      const claimIdMatch = userMessage.match(/\b[A-Z0-9]{5}\b/i);
      
      let context = '';
      
      if (claimIdMatch) {
        const claimId = claimIdMatch[0].toUpperCase();
        try {
          const jobs = await base44.entities.Job.list();
          const job = jobs.find(j => j.claim_id === claimId);
          
          if (job) {
            context = `\n\nCLAIM ID LOOKUP RESULT:\nClaim ID: ${claimId}\nProperty Owner: ${job.property_owner_name}\nAddress: ${job.property_address_line1}, ${job.property_city}, ${job.property_state}\nCurrent Status: ${HUMAN_STATUSES[job.current_status]}\nCreated: ${new Date(job.created_date).toLocaleDateString()}\nLast Updated: ${new Date(job.updated_date).toLocaleDateString()}`;
          } else {
            context = `\n\nCLAIM ID LOOKUP: No job found with claim ID "${claimId}". Please verify the ID and try again.`;
          }
        } catch (error) {
          console.error('Job lookup failed:', error);
          context = '\n\nNote: Unable to look up job details at this time.';
        }
      }

      const prompt = `You are a helpful AI assistant for CaseManager, a fire restoration case management system.

USER QUESTION: ${userMessage}
${context}

SYSTEM CONTEXT:
- CaseManager helps restoration companies manage fire/smoke damage claims
- Users can be: CompanyAdmin, SalesRep, Homeowner, Hygienist, Attorney, Contractor
- Jobs progress through 14 workflow stages from Lead Created to Case Closed
- Each job gets a unique 5-character claim ID (letters/numbers) after creation
- Homeowners can check status using their claim ID

COMMON TASKS YOU CAN HELP WITH:

1. LOGIN HELP:
   Step 1: Go to the login page at [app URL]
   Step 2: Click "Login via SSO" or use demo credentials (dev only)
   Step 3: If you don't have an account, contact your company admin to invite you
   Step 4: After first login, you'll see an onboarding tour - follow it!

2. CHECK JOB STATUS:
   - If user provides a 5-character claim ID (e.g., A3X9K), look it up and explain the current status
   - Explain what the current status means and what typically comes next
   
3. GENERAL GUIDANCE:
   - Navigate using the sidebar (Dashboard, Jobs, Fire Alerts, Users, Help)
   - Click Help in sidebar for detailed FAQs
   - Company Admins can manage users, roles, and settings
   - SalesReps can convert fire alerts to jobs
   - Homeowners have read-only access to their jobs

4. TROUBLESHOOTING:
   - Can't see jobs? Check your role - you only see jobs you have access to
   - Backend functions required for some features - ask admin to enable
   - Clear browser cache if you see stale data

Provide clear, step-by-step guidance. Be friendly and concise. If the user provided a claim ID and you found job details in the context, explain the current status and next steps.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            response: { type: 'string' }
          },
          required: ['response']
        }
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.response 
      }]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
              size="icon"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-2 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5" />
                    AI Assistant
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-900 border border-slate-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask me anything..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Tip: Provide your 5-digit claim ID to check job status
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}