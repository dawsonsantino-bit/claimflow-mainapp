import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { Loader2, Plus } from 'lucide-react';

export default function JobPayments({ job, user }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: "",
    payer_type: "Insurance",
    payment_type: "Check",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', job.id],
    queryFn: () => base44.entities.JobPayment.list({ job_id: job.id }, { received_at: -1 }),
  });

  const totalReceived = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await base44.entities.JobPayment.create({
        job_id: job.id,
        received_by_user_id: user.id,
        ...newPayment,
        amount: parseFloat(newPayment.amount),
        received_at: new Date().toISOString()
      });
      
      // Update job totals
      await base44.entities.Job.update(job.id, {
        total_payments_received: totalReceived + parseFloat(newPayment.amount)
      });
      
      setNewPayment({ amount: "", payer_type: "Insurance", payment_type: "Check", notes: "" });
      setIsAdding(false);
      queryClient.invalidateQueries(['payments', job.id]);
      queryClient.invalidateQueries(['job', job.id]);
    } catch (error) {
      console.error("Failed to add payment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
             <p className="text-sm font-medium text-slate-500">Approved Amount</p>
             <p className="text-2xl font-bold">${(job.insurance_approved_amount || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
             <p className="text-sm font-medium text-slate-500">Total Received</p>
             <p className="text-2xl font-bold text-green-600">${totalReceived.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
             <p className="text-sm font-medium text-slate-500">Outstanding</p>
             <p className="text-2xl font-bold text-orange-600">
                ${((job.insurance_approved_amount || 0) - totalReceived).toLocaleString()}
             </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Payment History</h3>
        <Button onClick={() => setIsAdding(!isAdding)} size="sm">
          {isAdding ? "Cancel" : "Record Payment"}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount ($)</label>
                  <Input 
                    required
                    type="number" 
                    value={newPayment.amount} 
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payer</label>
                  <Select 
                    value={newPayment.payer_type} 
                    onValueChange={(v) => setNewPayment({...newPayment, payer_type: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Insurance">Insurance Co.</SelectItem>
                      <SelectItem value="Homeowner">Homeowner</SelectItem>
                      <SelectItem value="Attorney">Attorney/Firm</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Method</label>
                  <Select 
                    value={newPayment.payment_type} 
                    onValueChange={(v) => setNewPayment({...newPayment, payment_type: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Wire">Wire Transfer</SelectItem>
                      <SelectItem value="ACH">ACH</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Input 
                  placeholder="Notes / Check Number..."
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Save Payment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {payments?.map((payment) => (
          <div key={payment.id} className="flex justify-between items-center p-4 bg-white border rounded-lg">
             <div>
                <p className="font-medium">{payment.payer_type} Payment</p>
                <p className="text-sm text-slate-500">
                    {format(new Date(payment.received_at), 'PP')} • {payment.payment_type}
                    {payment.notes && ` • ${payment.notes}`}
                </p>
             </div>
             <span className="font-bold text-lg">${payment.amount.toLocaleString()}</span>
          </div>
        ))}
         {(!payments || payments.length === 0) && (
          <div className="text-center py-8 text-slate-400">
            No payments recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}