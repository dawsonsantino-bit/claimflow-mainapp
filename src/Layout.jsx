import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Menu } from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { createPageUrl } from '@/utils';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Not logged in", error);
        // Protected route check
        const loginPath = createPageUrl('Login');
        // Normalize paths for check (base44 sometimes has varying paths)
        if (location.pathname !== '/Login' && location.pathname !== '/login') {
            window.location.href = loginPath;
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [location.pathname]);

  // If loading or not logged in (and not on home page which has its own layout logic typically, 
  // but here Layout wraps everything), handled gracefully.
  // Actually, for pages that don't need sidebar (like Home), we might want to conditional render.
  // But assuming this Layout wraps dashboard pages primarily.
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // If not logged in, render children (likely Home page or Redirect)
  if (!user) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
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
      </div>
    </div>
  );
}