import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const password = 'ab3x7k9m2r'; // fake sample password

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: 'dawson.santino@gmail.com',
    subject: 'Your ClaimFlow Account Credentials',
    body: `Hello Dawson,\n\nYour account has been created on ClaimFlow.\n\nUsername: dawson.santino@gmail.com\nTemporary Password: ${password}\n\nClick here to log in:\nhttps://claimflow.base44.app\n\nPlease log in and change your password at your earliest convenience.\n\nRole: SalesRep\n\nBest regards,\nClaimFlow Team`
  });

  return Response.json({ success: true, password });
});