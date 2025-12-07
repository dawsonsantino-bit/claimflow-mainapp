import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { APP_ENV } from '@/components/AppConfig';

export default function RoleRescue() {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {
        setStatus('error');
        setMessage('Not logged in');
      }
    };
    init();
  }, []);

  const handleRescue = async () => {
    if (!user) return;
    
    setStatus('loading');
    setMessage('Promoting user to CompanyAdmin + AppOwner...');

    try {
      // 1. Find first company or assign if needed
      let companyId = user.company_id;
      if (!companyId) {
        const companies = await base44.entities.Company.list();
        if (companies && companies.length > 0) {
          companyId = companies[0].id;
        }
      }

      // 2. Update user to CompanyAdmin + AppOwner
      await base44.auth.updateMe({
        business_role: 'CompanyAdmin',
        is_app_owner: true,
        company_id: companyId || user.company_id,
        email: user.email.toLowerCase() // Normalize email
      });

      // 3. Mark as done in localStorage
      localStorage.setItem('role_rescue_done', 'true');

      setStatus('success');
      setMessage(`✅ Success! You are now CompanyAdmin + AppOwner. Redirecting to /admin...`);

      // 4. Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = createPageUrl('Admin');
      }, 2000);

    } catch (error) {
      console.error('Role rescue failed', error);
      setStatus('error');
      setMessage(`Failed: ${error.message}`);
    }
  };

  // Check if already done
  const isDone = localStorage.getItem('role_rescue_done') === 'true';

  if (APP_ENV !== 'DEV' && APP_ENV !== 'dev') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>This page is only available in DEV mode.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <CardTitle>Role Rescue</CardTitle>
          <CardDescription>
            One-time action to promote current user to CompanyAdmin + AppOwner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && status !== 'error' && (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
              <p className="text-sm text-slate-500 mt-2">Loading user...</p>
            </div>
          )}

          {user && status === 'idle' && !isDone && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded text-sm">
                <p className="font-medium text-slate-900 mb-1">Current User:</p>
                <p className="text-slate-600">{user.email}</p>
                <p className="text-slate-500 text-xs">Role: {user.business_role || 'None'}</p>
              </div>
              <Button 
                onClick={handleRescue}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Promote to CompanyAdmin + AppOwner
              </Button>
            </div>
          )}

          {isDone && status === 'idle' && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-900">Already completed!</p>
              <p className="text-xs text-slate-500 mt-1">Role rescue has already been executed.</p>
              <Button 
                onClick={() => window.location.href = createPageUrl('Admin')}
                className="mt-4"
                variant="outline"
              >
                Go to Admin Dashboard
              </Button>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-slate-700">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-700">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">{message}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="mt-4"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}