import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, full_name, business_role, password } = await req.json();

  const displayName = full_name || email;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#1e293b;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">ClaimFlow</h1>
              <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Restoration Claims Management</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Welcome to ClaimFlow, ${displayName}!</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Your account has been created. Here are your login credentials:
              </p>

              <!-- Credentials Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;font-weight:600;">Email / Username</span><br>
                          <span style="color:#1e293b;font-size:15px;font-weight:600;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0 0;border-bottom:1px solid #e2e8f0;">
                          <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;font-weight:600;">Temporary Password</span><br>
                          <span style="color:#1e293b;font-size:18px;font-weight:700;font-family:monospace;letter-spacing:2px;">${password}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0 0;">
                          <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;font-weight:600;">Role</span><br>
                          <span style="color:#1e293b;font-size:15px;font-weight:600;">${business_role}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="https://claimflow.base44.app" style="display:inline-block;background-color:#1e293b;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;">
                      Log In to ClaimFlow →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;border-top:1px solid #e2e8f0;padding-top:20px;">
                Please log in and change your password as soon as possible. If you have any trouble logging in, contact your administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 ClaimFlow. This is an automated message — please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: email,
    subject: 'Your ClaimFlow Account is Ready',
    body: htmlBody
  });

  return Response.json({ success: true });
});