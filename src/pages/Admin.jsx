import React from 'react';
import CompanyAdminDashboard from '@/components/dashboard/CompanyAdminDashboard';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { USER_ROLES } from '@/components/job/JobConstants';

export default function Admin() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  if (!user) return null; // Layout handles redirect

  return <CompanyAdminDashboard user={user} />;
}