import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { USER_ROLES } from '@/components/job/JobConstants';
import { createPageUrl } from '@/utils';
import { isDev } from '@/components/AppConfig';

export default function SignIn() {
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect based on role
    const checkUser = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          handleRedirect(user.business_role);
        }
      } catch (e) {
        // Not logged in
      }
    };
    checkUser();
  }, []);

  const handleLogin = async (role, email) => {
    await base44.auth.logout();
    
    try {
        // For demo, we assume user is authenticated or we rely on platform login behavior
        // This part is tricky without custom auth, but we'll try to just set the role
        // after ensuring we are logged in.
        
        try {
            await base44.auth.me();
        } catch (e) {
             // If not logged in, redirect to login, then hopefully return here?
             // The platform login usually redirects to home.
             await base44.auth.redirectToLogin(window.location.href);
             return;
        }

        await base44.auth.updateMe({ 
            business_role: role,
            full_name: role === USER_ROLES.Homeowner ? 'Demo Homeowner' : role === USER_ROLES.SalesRep ? 'Demo Sales Rep' : 'Demo Admin'
        });
        
        handleRedirect(role);
        
    } catch (error) {
        console.error("Login error", error);
    }
  };

  const handleRedirect = (role) => {
    if (role === USER_ROLES.CompanyAdmin || role === USER_ROLES.LocationAdmin) {
        window.location.href = createPageUrl('Admin');
    } else if (role === USER_ROLES.SalesRep) {
        window.location.href = createPageUrl('Sales');
    } else if (role === USER_ROLES.Homeowner) {
        window.location.href = createPageUrl('Homeowner');
    } else {
        window.location.href = createPageUrl('Dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">ClaimFlow v2</CardTitle>
          <CardDescription>{isDev() ? 'Select a role to sign in (Demo Mode)' : 'Sign in to access your dashboard'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isDev() ? (
            <>
              <Button 
                size="lg" 
                className="w-full bg-slate-900 hover:bg-slate-800"
                onClick={() => handleLogin(USER_ROLES.CompanyAdmin, 'admin@demo.com')}
              >
                Sign in as Admin
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={() => handleLogin(USER_ROLES.SalesRep, 'salesrep@demo.com')}
              >
                Sign in as Sales Rep
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full text-slate-600"
                onClick={() => handleLogin(USER_ROLES.Homeowner, 'homeowner@demo.com')}
              >
                Sign in as Homeowner
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <Button 
                size="lg" 
                className="w-full bg-slate-900"
                onClick={() => base44.auth.redirectToLogin(window.location.origin + '/dashboard')}
              >
                Login via SSO
              </Button>
              <p className="text-sm text-slate-500 mt-4">Demo login disabled in Production.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}