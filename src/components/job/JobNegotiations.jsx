import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { Loader2, Plus, DollarSign } from 'lucide-react';

export default function JobNegotiations({ job, user }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({
    entry_type: "Offer",
    amount: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: negotiations, isLoading } = useQuery({
    queryKey: ['negotiations', job.id],
    queryFn: () => base44.entities.InsuranceNegotiation.list({ job_id: job.id }, { created_date: -1 }),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await base44.entities.InsuranceNegotiation.create({
        job_id: job.id,
        created_by_user_id: user.id,
        entry_type: newEntry.entry_type,
        amount: newEntry.amount ? parseFloat(newEntry.amount) : null,
        message: newEntry.message
      });
      
      // Reset
      setNewEntry({ entry_type: "Offer", amount: "", message: "" });
      setIsAdding(false);
      queryClient.invalidateQueries(['negotiations', job.id]);
    } catch (error) {
      console.error("Failed to add negotiation", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Insurance Negotiation Log</h3>
        <Button onClick={() => setIsAdding(!isAdding)} size="sm">
          {isAdding ? "Cancel" : "Add Entry"}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={newEntry.entry_type} 
                    onValueChange={(v) => setNewEntry({...newEntry, entry_type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Offer">Offer (from Insurance)</SelectItem>
                      <SelectItem value="Counter">Counter Demand</SelectItem>
                      <SelectItem value="Denial">Denial</SelectItem>
                      <SelectItem value="Note">Internal Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount ($)</label>
                  <Input 
                    type="number" 
                    value={newEntry.amount} 
                    onChange={(e) => setNewEntry({...newEntry, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes / Message</label>
                <Textarea 
                  required
                  value={newEntry.message}
                  onChange={(e) => setNewEntry({...newEntry, message: e.target.value})}
                  placeholder="Details regarding this interaction..."
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Log Entry
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {negotiations?.map((item) => (
          <Card key={item.id} className={`border-l-4 ${
            item.entry_type === 'Offer' ? 'border-l-green-500' :
            item.entry_type === 'Counter' ? 'border-l-blue-500' :
            item.entry_type === 'Denial' ? 'border-l-red-500' : 'border-l-gray-300'
          }`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                    item.entry_type === 'Offer' ? 'bg-green-100 text-green-800' :
                    item.entry_type === 'Counter' ? 'bg-blue-100 text-blue-800' :
                    item.entry_type === 'Denial' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.entry_type}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {format(new Date(item.created_date), 'PP p')}
                  </span>
                </div>
                {item.amount && (
                  <div className="text-lg font-bold text-slate-900">
                    ${item.amount.toLocaleString()}
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.message}</p>
            </CardContent>
          </Card>
        ))}
        
        {(!negotiations || negotiations.length === 0) && (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-lg">
            No negotiation history recorded.
          </div>
        )}
      </div>
    </div>
  );
}