import React, { createContext, useState, useEffect, useContext } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [accessBinding, setAccessBinding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await base44.auth.me();
        
        // Normalize email
        const email = user.email.toLowerCase();
        user.email = email;
        
        // Check for AppAccessBinding
        if (user.company_id) {
          try {
            const bindings = await base44.entities.AppAccessBinding.list();
            const binding = bindings.find(b => 
              b.company_id === user.company_id && 
              b.email === email
            );
            
            if (!binding) {
              setAccessError('not_configured');
              setLoading(false);
              return;
            }
            
            if (binding.is_suspended) {
              setAccessError('suspended');
              setLoading(false);
              return;
            }
            
            // Apply role from binding
            user.business_role = binding.role;
            setAccessBinding(binding);
          } catch (err) {
            console.warn('AppAccessBinding check failed:', err);
            // Continue with user's existing role if binding check fails
          }
        }
        
        setCurrentUser(user);
        setAccessError(null);
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (accessError === 'not_configured') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Not Configured</h2>
          <p className="text-slate-600 mb-6">
            Your email address is not enabled for access to this application. 
            Please contact your company administrator to grant access.
          </p>
          <button
            onClick={() => base44.auth.logout()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (accessError === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⛔</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Suspended</h2>
          <p className="text-slate-600 mb-6">
            This account is suspended. Please contact your administrator for assistance.
          </p>
          <button
            onClick={() => base44.auth.logout()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, accessBinding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}