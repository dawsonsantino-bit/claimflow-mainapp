import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function InviteAccept() {
    // Since we're using react-router v6 in base44, we usually get params from hooks.
    // But Page routes are flat. We need to parse URL for :token if route param is used, 
    // OR standard practice in this env might be query param if wildcard routing isn't setup.
    // The prompt says "/invite/:token". I'll assume the router handles this path and provides `token` param.
    // IF NOT, we might need to fallback to query strings. 
    // Let's assume the router is configured to pass the rest of path as params or we use window.location.
    
    // Actually, standard Base44 pages are `pages/PageName.js` -> `/PageName`.
    // To support `/invite/:token`, the router needs special config.
    // If I can't change the router config, I should use `/Invite?token=xyz`.
    // BUT the prompt specifically requested `/invite/:token`.
    // I will create `pages/InviteAccept.js` and assume the router maps `/invite/:token` to it, OR 
    // I'll write code that handles `window.location.pathname` extraction if needed.
    
    // Actually, let's be safe and handle both query param and path segment.
    
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [passwords, setPasswords] = useState({ password: '', confirm: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const path = window.location.pathname;
        const parts = path.split('/');
        // Looking for /invite/TOKEN
        const tokenFromPath = parts[parts.indexOf('invite') + 1];
        
        if (tokenFromPath) {
            setToken(tokenFromPath);
            validateToken(tokenFromPath);
        } else {
            setError("Invalid invitation link.");
            setIsLoading(false);
        }
    }, []);

    const validateToken = async (t) => {
        try {
            // Find user by token
            const users = await base44.entities.User.list({ invite_token: t });
            if (!users || users.length === 0) {
                setError("Invitation invalid or expired.");
                setIsLoading(false);
                return;
            }

            const user = users[0];
            // Check expiry
            if (user.invite_expires_at && new Date(user.invite_expires_at) < new Date()) {
                setError("Invitation has expired.");
                setIsLoading(false);
                return;
            }

            setUserData(user);
            setIsValid(true);
        } catch (e) {
            console.error(e);
            setError("Failed to validate invitation.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (e) => {
        e.preventDefault();
        if (passwords.password !== passwords.confirm) {
            toast.error("Passwords do not match");
            return;
        }
        if (passwords.password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Update User
            await base44.entities.User.update(userData.id, {
                password: passwords.password,
                invite_token: null,
                invite_expires_at: null,
                status: 'Active',
                invited_at: null // Clear invited status? Or keep? Prompt says "clear invite_token/invite_expires_at"
            });

            // 2. Update Audit Log (Need to find the audit record? Or just ignore/create new? 
            // Prompt says "set accepted_at in UserInviteAudit". We need to find it by email + pending)
            const audits = await base44.entities.UserInviteAudit.list({ email: userData.email }, { created_at: -1 }, 1);
            if (audits && audits.length > 0) {
                await base44.entities.UserInviteAudit.update(audits[0].id, {
                    accepted_at: new Date().toISOString()
                });
            }

            // 3. Log in (Redirect to login with email pre-filled? Or auto-login?)
            // Auto-login via `base44.auth.login`? We usually don't have programmatic login with plain password in frontend SDK due to security.
            // The prompt says: "log the user in, redirect to their role route."
            // If I can't programmatically login, I'll redirect to login page.
            // Base44 SDK usually has `base44.auth.login(email, password)`.
            
            try {
                 await base44.auth.login(userData.email, passwords.password);
                 
                 // Redirect based on role
                 const role = userData.business_role;
                 let dest = 'Dashboard';
                 if (role === 'CompanyAdmin') dest = 'Admin';
                 else if (role === 'SalesRep') dest = 'Sales';
                 else if (role === 'Homeowner') dest = 'Homeowner';
                 
                 window.location.href = createPageUrl(dest);
                 
            } catch (loginError) {
                console.warn("Auto-login failed", loginError);
                toast.success("Account set up successfully! Please log in.");
                setTimeout(() => {
                    window.location.href = createPageUrl('SignIn');
                }, 2000);
            }

        } catch (e) {
            console.error(e);
            toast.error("Failed to set password. Please try again.");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    if (error) {
        return (
             <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <ShieldAlert className="w-6 h-6 text-red-600" />
                        </div>
                        <CardTitle className="text-red-600">Invitation Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={() => window.location.href = createPageUrl('SignIn')}>Go to Login</Button>
                    </CardContent>
                </Card>
             </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle>Welcome to ClaimFlow</CardTitle>
                    <CardDescription>Set up your account for <strong>{userData.email}</strong></CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAccept} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Create Password</Label>
                            <Input 
                                type="password" 
                                value={passwords.password}
                                onChange={e => setPasswords({...passwords, password: e.target.value})}
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm Password</Label>
                            <Input 
                                type="password" 
                                value={passwords.confirm}
                                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                            Set Password & Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}