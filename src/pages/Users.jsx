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
import { Loader2, UserPlus, Shield, ShieldOff, KeyRound, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { USER_ROLES } from '@/components/job/JobConstants';
import toast from 'react-hot-toast';

export default function Users() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tempPasswordDisplay, setTempPasswordDisplay] = useState(null);

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
      const tempPassword = Math.random().toString(36).slice(-10).toUpperCase();
      const newUserData = {
        ...userData,
        company_id: user.company_id,
        temp_password: tempPassword,
        email: userData.email.toLowerCase()
      };
      
      const createdUser = await base44.entities.User.create(newUserData);
      
      await base44.entities.UserAction.create({
        user_id: user.id,
        target_user_id: createdUser.id,
        action_type: 'AddUser',
        details: `Added ${userData.email} as ${userData.business_role}`,
        timestamp: new Date().toISOString()
      });
      
      return { user: createdUser, tempPassword };
    },
    onSuccess: ({ user: createdUser, tempPassword }) => {
      queryClient.invalidateQueries(['allUsers']);
      setTempPasswordDisplay({
        email: createdUser.email,
        password: tempPassword
      });
      toast.success(`User ${createdUser.email} created`);
      setNewUser({ email: '', full_name: '', business_role: 'SalesRep' });
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

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId) => {
      const tempPassword = Math.random().toString(36).slice(-10).toUpperCase();
      await base44.entities.User.update(userId, { temp_password: tempPassword });
      await base44.entities.UserAction.create({
        user_id: user.id,
        target_user_id: userId,
        action_type: 'ResetPassword',
        details: 'Password reset',
        timestamp: new Date().toISOString()
      });
      return tempPassword;
    },
    onSuccess: (tempPassword, userId) => {
      const targetUser = allUsers.find(u => u.id === userId);
      setTempPasswordDisplay({
        email: targetUser?.email,
        password: tempPassword
      });
      toast.success('Password reset');
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
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

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Backend Functions Required</p>
              <p>Full access control (login gate, rate limiting, server-side role enforcement, email invites) requires backend functions. Enable in Settings to unlock these features.</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                        >
                          <KeyRound className="w-3 h-3 mr-1" />
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
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {tempPasswordDisplay && (
        <Dialog open={!!tempPasswordDisplay} onOpenChange={() => setTempPasswordDisplay(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                User Created
              </DialogTitle>
              <DialogDescription>Share this temporary password with the user</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={tempPasswordDisplay.email} readOnly />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(tempPasswordDisplay.email)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Temporary Password</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    value={tempPasswordDisplay.password} 
                    readOnly 
                    className="font-mono text-lg"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(tempPasswordDisplay.password)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                This password will not be shown again. Copy it before closing.
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setTempPasswordDisplay(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}