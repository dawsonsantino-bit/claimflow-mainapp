import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, full_name, business_role, password } = await req.json();

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: email,
    subject: 'Your ClaimFlow Account Credentials',
    body: `Hello ${full_name || email},\n\nYour account has been created on ClaimFlow.\n\nUsername: ${email}\nTemporary Password: ${password}\n\nClick here to log in:\nhttps://claimflow.base44.app\n\nPlease log in and change your password at your earliest convenience.\n\nRole: ${business_role}\n\nBest regards,\nClaimFlow Team`
  });

  return Response.json({ success: true });
});