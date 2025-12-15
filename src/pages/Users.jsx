import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, UserPlus, Shield, ShieldOff, Trash2, AlertCircle, Info } from 'lucide-react';
import { USER_ROLES } from '@/components/job/JobConstants';
import toast from 'react-hot-toast';

export default function Users() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [newAccess, setNewAccess] = useState({
    email: '',
    role: 'SalesRep'
  });

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {
        console.error('Auth error', e);
      }
    };
    init();
  }, []);

  const { data: accessBindings = [], isLoading } = useQuery({
    queryKey: ['accessBindings', user?.company_id],
    queryFn: async () => {
      if (!user?.company_id) return [];
      const bindings = await base44.entities.AppAccessBinding.list();
      return bindings.filter(b => b.company_id === user.company_id);
    },
    enabled: !!user?.company_id
  });

  const filteredBindings = accessBindings.filter(b => {
    if (filterRole !== 'all' && b.role !== filterRole) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'suspended' && !b.is_suspended) return false;
      if (filterStatus === 'active' && b.is_suspended) return false;
    }
    return true;
  });

  const addAccessMutation = useMutation({
    mutationFn: async (accessData) => {
      const email = accessData.email.toLowerCase();
      
      // Check if already exists
      const existing = accessBindings.find(b => b.email === email);
      if (existing) {
        // Update existing
        await base44.entities.AppAccessBinding.update(existing.id, {
          role: accessData.role,
          is_suspended: false
        });
        return { updated: true, email };
      } else {
        // Create new
        await base44.entities.AppAccessBinding.create({
          company_id: user.company_id,
          email,
          role: accessData.role,
          is_suspended: false
        });
        return { updated: false, email };
      }
    },
    onSuccess: ({ updated, email }) => {
      queryClient.invalidateQueries(['accessBindings']);
      toast.success(updated ? `Access updated for ${email}` : `Access granted to ${email}`);
      setNewAccess({ email: '', role: 'SalesRep' });
      setShowAddDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const toggleSuspendMutation = useMutation({
    mutationFn: async ({ bindingId, suspend }) => {
      await base44.entities.AppAccessBinding.update(bindingId, { is_suspended: suspend });
    },
    onSuccess: (_, { suspend }) => {
      queryClient.invalidateQueries(['accessBindings']);
      toast.success(suspend ? 'Access suspended' : 'Access enabled');
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ bindingId, newRole }) => {
      await base44.entities.AppAccessBinding.update(bindingId, { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accessBindings']);
      toast.success('Role updated');
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const removeAccessMutation = useMutation({
    mutationFn: async (bindingId) => {
      await base44.entities.AppAccessBinding.delete(bindingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accessBindings']);
      toast.success('Access removed');
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const handleAddAccess = () => {
    if (!newAccess.email) {
      toast.error('Email is required');
      return;
    }
    addAccessMutation.mutate(newAccess);
  };

  if (!user) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  if (![USER_ROLES.CompanyAdmin].includes(user.business_role) && !user.is_app_owner) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
        <p className="text-slate-500">Access management is only available to Company Admins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">App Access Management</h1>
        <p className="text-sm text-slate-500">Control who can access the app and their roles</p>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">User Invitations via Base44</p>
              <p>User invitations and passwords are managed in Base44 → Team. This page only controls app access and roles. After adding access here, invite the user via Base44 so they can log in.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newAccess.email}
                onChange={(e) => setNewAccess({ ...newAccess, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="flex-1">
              <Label>Role *</Label>
              <Select 
                value={newAccess.role} 
                onValueChange={(role) => setNewAccess({ ...newAccess, role })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(USER_ROLES).map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddAccess} disabled={addAccessMutation.isPending}>
              {addAccessMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Grant Access</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Access Bindings ({filteredBindings.length})</CardTitle>
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.values(USER_ROLES).map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBindings.map(binding => (
                  <TableRow key={binding.id}>
                    <TableCell className="font-medium">{binding.email}</TableCell>
                    <TableCell>
                      <Select
                        value={binding.role}
                        onValueChange={(newRole) => changeRoleMutation.mutate({ bindingId: binding.id, newRole })}
                        disabled={binding.email === user.email}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(USER_ROLES).map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {binding.is_suspended ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {binding.updated_date 
                        ? new Date(binding.updated_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={binding.is_suspended ? "outline" : "ghost"}
                          onClick={() => toggleSuspendMutation.mutate({ 
                            bindingId: binding.id, 
                            suspend: !binding.is_suspended 
                          })}
                          disabled={binding.email === user.email}
                        >
                          {binding.is_suspended ? (
                            <><Shield className="w-3 h-3 mr-1" /> Enable</>
                          ) : (
                            <><ShieldOff className="w-3 h-3 mr-1" /> Suspend</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Remove access for ${binding.email}?`)) {
                              removeAccessMutation.mutate(binding.id);
                            }
                          }}
                          disabled={binding.email === user.email}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBindings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No access bindings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}