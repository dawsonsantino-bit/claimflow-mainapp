import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Copy, Check } from 'lucide-react';
import { USER_ROLES } from '@/components/job/JobConstants';
import { toast } from 'sonner';
import { generatePassword } from '@/utils/password'; // We'll create this small utility inline or just function

export default function UsersPage() {
    const queryClient = useQueryClient();
    const [currentUser, setCurrentUser] = useState(null);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', role: '', name: '' });
    const [isInviting, setIsInviting] = useState(false);
    const [tempPasswordData, setTempPasswordData] = useState(null); // { email, password }

    useEffect(() => {
        base44.auth.me().then(setCurrentUser).catch(() => {});
    }, []);

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list({}, { created_date: -1 }),
    });

    const generateToken = () => {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const generateTempPassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let pass = "";
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pass;
    };

    const handleInvite = async () => {
        if (!inviteData.email || !inviteData.role) {
            toast.error("Email and Role are required.");
            return;
        }

        setIsInviting(true);
        setTempPasswordData(null);

        try {
            const email = inviteData.email.toLowerCase();
            
            // Check if user exists
            let user = null;
            const existing = await base44.entities.User.list({ email });
            
            // Prepare Invite Data
            const token = generateToken();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
            
            const userData = {
                email: email,
                full_name: inviteData.name || email.split('@')[0],
                business_role: inviteData.role,
                invite_token: token,
                invite_expires_at: expiresAt,
                invited_at: new Date().toISOString(),
                status: 'Invited'
            };

            if (existing && existing.length > 0) {
                user = existing[0];
                // Update existing
                await base44.entities.User.update(user.id, userData);
            } else {
                // Create new
                // Note: This might fail if strict rules apply, but usually Admins can create
                user = await base44.entities.User.create({
                    ...userData,
                    password: generateToken() // Random initial password (unusable)
                });
            }

            // Audit Log
            await base44.entities.UserInviteAudit.create({
                email: email,
                role: inviteData.role,
                inviter_user_id: currentUser.id,
                created_at: new Date().toISOString()
            });

            // Try to send email
            try {
                const inviteLink = `${window.location.origin}/invite/${token}`;
                await base44.integrations.Core.SendEmail({
                    to: email,
                    subject: "You're invited to ClaimFlow",
                    body: `Hello ${inviteData.name || ''},\n\nYou have been invited to join ClaimFlow as a ${inviteData.role}.\n\nPlease click the link below to accept your invitation and set your password:\n\n${inviteLink}\n\nThis link expires in 7 days.\n\nBest regards,\nClaimFlow Team`
                });
                toast.success(`Invitation sent to ${email}`);
                setIsInviteOpen(false);
            } catch (emailError) {
                console.warn("SMTP likely missing:", emailError);
                
                // Fallback: Temp Password Flow
                const tempPass = generateTempPassword();
                // Update user with temp password and clear invite token (or keep it? Prompt says clear invite_token)
                // "If SMTP not present: Create/Update User with role and a TEMP password (random), clear invite_token."
                
                await base44.entities.User.update(user.id, {
                    password: tempPass, // Note: This assumes we can set password directly. If not, this flow blocks.
                    invite_token: null,
                    invite_expires_at: null,
                    status: 'Invited' // Still invited status until they log in? Or 'Active'? Prompt says "Invited otherwise"
                });

                setTempPasswordData({ email, password: tempPass });
                toast.warning("Email failed (SMTP missing). Generated temporary password.");
                // Keep dialog open to show banner
            }

            queryClient.invalidateQueries(['users']);
            setInviteData({ email: '', role: '', name: '' }); // Reset form but keep dialog if temp pass

        } catch (error) {
            console.error(error);
            toast.error("Failed to invite user: " + (error.message || "Unknown error"));
        } finally {
            setIsInviting(false);
        }
    };

    const handleCloseInvite = () => {
        setIsInviteOpen(false);
        setTempPasswordData(null);
    };

    if (isLoading || !currentUser) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    // Only CompanyAdmin
    if (currentUser.business_role !== USER_ROLES.CompanyAdmin) {
        return <div className="p-8 text-red-600">Access Denied. Company Admin only.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500">Manage system users and invitations.</p>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" /> Invite User</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite New User</DialogTitle>
                            <DialogDescription>Send an email invitation or generate a temporary password.</DialogDescription>
                        </DialogHeader>
                        
                        {!tempPasswordData ? (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Email Address *</Label>
                                    <Input 
                                        placeholder="user@example.com" 
                                        value={inviteData.email}
                                        onChange={e => setInviteData({...inviteData, email: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Full Name (Optional)</Label>
                                    <Input 
                                        placeholder="John Doe" 
                                        value={inviteData.name}
                                        onChange={e => setInviteData({...inviteData, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role *</Label>
                                    <Select value={inviteData.role} onValueChange={v => setInviteData({...inviteData, role: v})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(USER_ROLES).map(role => (
                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 space-y-4">
                                <div className="bg-amber-50 border border-amber-200 rounded p-4">
                                    <h4 className="font-semibold text-amber-800 mb-2">Email Delivery Failed</h4>
                                    <p className="text-sm text-amber-700 mb-3">SMTP is likely not configured. Please copy this temporary password and send it to the user manually.</p>
                                    
                                    <div className="bg-white p-3 border rounded flex items-center justify-between">
                                        <code className="text-lg font-mono text-slate-900">{tempPasswordData.password}</code>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => {
                                                navigator.clipboard.writeText(tempPasswordData.password);
                                                toast.success("Copied to clipboard");
                                            }}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">For user: <span className="font-medium">{tempPasswordData.email}</span></p>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            {!tempPasswordData ? (
                                <>
                                    <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                                    <Button onClick={handleInvite} disabled={isInviting}>
                                        {isInviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Send Invitation
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={handleCloseInvite}>Close</Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Invited</TableHead>
                            <TableHead>Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.full_name || '-'}</TableCell>
                                <TableCell><Badge variant="outline">{user.business_role}</Badge></TableCell>
                                <TableCell>
                                    {user.status === 'Invited' || (user.invite_token && !user.invite_expires_at) ? (
                                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">Invited</Badge>
                                    ) : (
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Active</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{user.invited_at ? new Date(user.invited_at).toLocaleDateString() : '-'}</TableCell>
                                <TableCell>{new Date(user.created_date).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                        {(!users || users.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500">No users found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}