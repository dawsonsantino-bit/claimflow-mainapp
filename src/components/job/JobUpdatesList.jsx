import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Bell, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function JobUpdatesList({ job }) {
    const { data: updates, isLoading } = useQuery({
        queryKey: ['jobUpdates', job.id],
        queryFn: () => base44.entities.JobUpdate.list({ 
            job_id: job.id, 
            audience: 'Homeowner' 
        }, { created_date: -1 }, 5), // Sort by newest first, limit 5
    });

    if (isLoading) {
        return <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>;
    }

    if (!updates || updates.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Updates
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-500 text-sm">No updates yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Updates
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {updates.map((update) => (
                    <div key={update.id} className="border-l-2 border-slate-200 pl-4 py-1 relative">
                         {/* Dot */}
                        <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-slate-300" />
                        
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs text-slate-400 font-medium">
                                {update.created_date ? format(new Date(update.created_date), 'MMM d, h:mm a') : 'Just now'}
                            </span>
                            {update.generated_by_ai && (
                                <Badge variant="outline" className="text-[10px] px-1 h-4 gap-1 text-indigo-500 border-indigo-200">
                                    <Sparkles className="w-2 h-2" /> AI
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {update.text || update.message}
                        </p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}