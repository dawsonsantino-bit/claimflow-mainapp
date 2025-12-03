import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          window.location.href = '/dashboard';
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Restoration Case Manager
          </CardTitle>
          <CardDescription className="text-base text-slate-500">
            Secure portal for claims management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full h-12 text-base font-medium bg-slate-900 hover:bg-slate-800"
            onClick={() => base44.auth.redirectToLogin('/dashboard')}
          >
            Sign In to Your Account
          </Button>
          <div className="text-center text-sm text-slate-400 pt-4">
            Protected System. Authorized Access Only.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}