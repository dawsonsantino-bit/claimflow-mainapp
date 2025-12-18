import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { APP_ENV } from '@/components/AppConfig';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import AIAssistant from '@/components/assistant/AIAssistant';

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <InnerLayout>{children}</InnerLayout>
    </AuthProvider>
  );
}

function InnerLayout({ children }) {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Check for public routes
  const path = location.pathname.toLowerCase();
  const isPublic = path === '/signin' || path === '/login';

  useEffect(() => {
    if (currentUser && !currentUser.onboarding_completed) {
      // Show onboarding after a brief delay
      const timer = setTimeout(() => setShowOnboarding(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  if (isPublic) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <AppSidebar user={currentUser} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile Header */}
          <header className="lg:hidden bg-white border-b border-slate-200 h-16 flex items-center px-4 sticky top-0 z-30">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="ml-3 font-bold text-slate-900">CaseManager</span>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          <div className="bg-slate-100 border-t border-slate-200 px-4 py-1 text-[10px] text-slate-400 text-right uppercase">
            Env: {APP_ENV}
          </div>
        </div>

        {/* Onboarding Tour */}
        {showOnboarding && currentUser && (
          <OnboardingTour
            user={currentUser}
            onComplete={() => setShowOnboarding(false)}
            onSkip={() => setShowOnboarding(false)}
          />
        )}

        {/* AI Assistant */}
        <AIAssistant />
      </div>
    </ProtectedRoute>
  );
}