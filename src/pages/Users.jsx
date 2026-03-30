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
import { Loader2, UserPlus, Shield, ShieldOff, KeyRound, Mail } from 'lucide-react';
import { USER_ROLES } from '@/components/job/JobConstants';
import toast from 'react-hot-toast';

export default function Users() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');


  // Add User Form State
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    business_role: 'SalesRep'
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

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['allUsers', user?.company_id],
    queryFn: async () => {
      if (!user?.company_id) return [];
      const users = await base44.entities.User.list();
      return users.filter(u => u.company_id === user.company_id);
    },
    enabled: !!user?.company_id
  });

  // Filter users
  const filteredUsers = allUsers.filter(u => {
    if (filterRole !== 'all' && u.business_role !== filterRole) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'suspended' && !u.is_suspended) return false;
      if (filterStatus === 'active' && u.is_suspended) return false;
      if (filterStatus === 'pending' && !u.invite_token) return false;
    }
    return true;
  });

  // Mutations
  const addUserMutation = useMutation({
    mutationFn: async (userData) => {
      const email = userData.email.toLowerCase();
      // Invite the user via the platform (creates account + sends invite email)
      await base44.users.inviteUser(email, 'user');
      
      // After invite, find the created user record and set role + company
      // Give it a moment for the record to be created
      await new Promise(r => setTimeout(r, 1500));
      const allU = await base44.entities.User.list();
      const created = allU.find(u => u.email === email);
      
      if (created) {
        await base44.entities.User.update(created.id, {
          business_role: userData.business_role,
          company_id: user.company_id,
          full_name: userData.full_name || created.full_name || ''
        });
        await base44.entities.UserAction.create({
          user_id: user.id,
          target_user_id: created.id,
          action_type: 'InviteSent',
          details: `Invited ${email} as ${userData.business_role}`,
          timestamp: new Date().toISOString()
        });
        return created;
      }
      return { email };
    },
    onSuccess: (createdUser) => {
      queryClient.invalidateQueries(['allUsers']);
      toast.success(`Invite sent to ${createdUser.email}`);
      setNewUser({ email: '', full_name: '', business_role: 'SalesRep' });
      setShowAddDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const toggleSuspendMutation = useMutation({
    mutationFn: async ({ userId, suspend }) => {
      await base44.entities.User.update(userId, { is_suspended: suspend });
      await base44.entities.UserAction.create({
        user_id: user.id,
        target_user_id: userId,
        action_type: suspend ? 'SuspendUser' : 'EnableUser',
        details: suspend ? 'Account suspended' : 'Account enabled',
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: (_, { suspend }) => {
      queryClient.invalidateQueries(['allUsers']);
      toast.success(suspend ? 'User suspended' : 'User enabled');
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      await base44.entities.User.update(userId, { business_role: newRole });
      await base44.entities.UserAction.create({
        user_id: user.id,
        target_user_id: userId,
        action_type: 'ChangeRole',
        details: `Role changed to ${newRole}`,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      toast.success('Role updated');
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  // Reset password sends a new invite so user can set their own password
  const resetPasswordMutation = useMutation({
    mutationFn: async (targetUserId) => {
      const targetUser = allUsers.find(u => u.id === targetUserId);
      if (!targetUser?.email) throw new Error('User not found');
      // Re-invite sends a fresh login link
      await base44.users.inviteUser(targetUser.email, targetUser.role || 'user');
      await base44.entities.UserAction.create({
        user_id: user.id,
        target_user_id: targetUserId,
        action_type: 'ResetPassword',
        details: 'Password reset invite sent',
        timestamp: new Date().toISOString()
      });
      return targetUser.email;
    },
    onSuccess: (email) => {
      toast.success(`Password reset invite sent to ${email}`);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const handleAddUser = () => {
    if (!newUser.email) {
      toast.error('Email is required');
      return;
    }
    addUserMutation.mutate(newUser);
  };

  if (!user) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  if (![USER_ROLES.CompanyAdmin].includes(user.business_role) && !user.is_app_owner) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
        <p className="text-slate-500">User management is only available to Company Admins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Manage users, roles, and access</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Label>Role</Label>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.values(USER_ROLES).map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Invite Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{filteredUsers.length} Users</CardTitle>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.full_name || '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={u.business_role}
                        onValueChange={(newRole) => changeRoleMutation.mutate({ userId: u.id, newRole })}
                        disabled={u.id === user.id}
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
                      {u.is_suspended ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : u.invite_token ? (
                        <Badge variant="secondary">Invite Pending</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {u.last_login_at 
                        ? new Date(u.last_login_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={u.is_suspended ? "outline" : "ghost"}
                          onClick={() => toggleSuspendMutation.mutate({ 
                            userId: u.id, 
                            suspend: !u.is_suspended 
                          })}
                          disabled={u.id === user.id}
                        >
                          {u.is_suspended ? (
                            <><Shield className="w-3 h-3 mr-1" /> Enable</>
                          ) : (
                            <><ShieldOff className="w-3 h-3 mr-1" /> Suspend</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resetPasswordMutation.mutate(u.id)}
                          disabled={resetPasswordMutation.isPending}
                          title="Send password reset invite email"
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Reset
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Select 
                value={newUser.business_role} 
                onValueChange={(role) => setNewUser({ ...newUser, business_role: role })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={addUserMutation.isPending}>
              {addUserMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Invite...</>
              ) : (
                'Send Invite'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}