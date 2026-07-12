/**
 * Minimal email sender using Resend's REST API directly (no SDK dependency,
 * so it doesn't add anything to package.json). Inactive — calls silently
 * no-op — until RESEND_API_KEY is set, so the app runs fine without it.
 *
 * To activate: create a Resend account, verify your sending domain, set
 * RESEND_API_KEY and EMAIL_FROM in your env. That's it — every notification
 * already routes through here via notify() in actions.ts.
 */
export async function sendEmail(to: string, subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Golden Pass <notifications@goldenpass.ae>';
  if (!apiKey) return; // no-op until configured — in-app notifications still work

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html: emailTemplate(subject, body),
      }),
    });
  } catch (err) {
    // Never let an email failure break the underlying action (payment
    // confirmation, document review, etc.) — log and move on.
    console.error('sendEmail failed:', err);
  }
}

function emailTemplate(subject: string, body: string) {
  return `
  <div style="font-family: Arial, sans-serif; background:#F7F3EA; padding:32px;">
    <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #E7E1D3;">
      <div style="background:#0E2A47; padding:20px 24px;">
        <span style="color:#E4C77E; font-size:18px; font-weight:700; font-family: Georgia, serif;">Golden Pass</span>
      </div>
      <div style="padding:24px;">
        <h2 style="color:#0E2A47; font-size:17px; margin:0 0 12px;">${subject}</h2>
        <p style="color:#1B2733; font-size:14px; line-height:1.6; margin:0;">${body}</p>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard"
           style="display:inline-block; margin-top:20px; background:linear-gradient(135deg,#E4C77E,#C89B3C); color:#081A2E; text-decoration:none; font-weight:700; padding:12px 20px; border-radius:12px; font-size:13px;">
          View on Golden Pass
        </a>
      </div>
    </div>
  </div>`;
}
