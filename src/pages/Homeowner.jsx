import React from 'react';
import HomeownerDashboard from '@/components/dashboard/HomeownerDashboard';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function Homeowner() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  if (!user) return null;

  return <HomeownerDashboard user={user} />;
}