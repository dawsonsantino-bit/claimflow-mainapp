import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { USER_ROLES } from '@/components/job/JobConstants';
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
             window.location.href = createPageUrl('Login');
             return;
        }
        
        // Auto-assign Homeowner role if missing
        let role = currentUser.business_role;
        if (!role) {
            role = USER_ROLES.Homeowner;
            await base44.auth.updateMe({ business_role: role });
        }

        // Redirect based on role
        if (role === USER_ROLES.CompanyAdmin || role === USER_ROLES.LocationAdmin) {
            window.location.href = createPageUrl('Admin');
        } else if (role === USER_ROLES.SalesRep) {
            window.location.href = createPageUrl('Sales');
        } else if (role === USER_ROLES.Homeowner) {
            window.location.href = createPageUrl('Homeowner');
        } else {
            // Fallback for other roles or unknown
             setUser({ ...currentUser, business_role: role });
        }

      } catch (error) {
        window.location.href = createPageUrl('Login');
      }
    };
    init();
  }, []);

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
      <p>Redirecting...</p>
    </div>
  );
}