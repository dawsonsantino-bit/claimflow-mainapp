import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function ResetPassword() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // We can attempt to send a reset link if we implement the token logic, 
            // OR use Base44 auth reset if available.
            // Prompt says: "email a reset token (if SMTP), or show an inline admin-only warning if SMTP missing."
            // Since I don't know if I'm admin here (public page), I can't show admin warnings easily unless I just try/catch.
            // I'll try to assume we use the same token system: generate token, save to user, email it.
            
            const users = await base44.entities.User.list({ email: email.toLowerCase() });
            
            if (users && users.length > 0) {
                const user = users[0];
                const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
                const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(); // 1 hour

                // Assuming we use same invite_token field or a new one. Prompt implied "invite fields" for invite flow.
                // I'll re-use invite_token for simplicity as it serves the same "one time link" purpose, 
                // but invite flow usually sets status. Reset shouldn't change status.
                
                await base44.entities.User.update(user.id, {
                    invite_token: token,
                    invite_expires_at: expiresAt
                });

                try {
                    await base44.integrations.Core.SendEmail({
                        to: email,
                        subject: "Reset Your Password",
                        body: `Click here to reset your password: ${window.location.origin}/invite/${token}\n\nThis link expires in 1 hour.`
                    });
                    // If success
                } catch (emailError) {
                    console.warn("SMTP missing for reset");
                    // "show a message explaining email isn’t configured" (Public facing)
                    toast.error("System email is not configured. Please contact an administrator.");
                    setIsSubmitting(false);
                    return; 
                }
            }
            
            // Always show success to prevent enumeration (unless SMTP error caught above)
            setIsSent(true);

        } catch (error) {
            console.error(error);
            toast.error("Failed to request reset.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>Enter your email to receive a reset link.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!isSent ? (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    required 
                                    placeholder="you@example.com"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Mail className="mr-2 w-4 h-4" />}
                                Send Reset Link
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">Check your email</h3>
                            <p className="text-slate-500 mt-2">If an account exists for {email}, we have sent a password reset link.</p>
                            <Button variant="outline" className="mt-6" onClick={() => window.location.href = createPageUrl('SignIn')}>
                                Return to Login
                            </Button>
                        </div>
                    )}
                    
                    {!isSent && (
                         <div className="mt-4 text-center">
                            <Button variant="link" className="text-slate-500" onClick={() => window.location.href = createPageUrl('SignIn')}>
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}