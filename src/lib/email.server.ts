/** Server-only transactional email through Brevo. */

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

/** Verified sender in Brevo, and the inbox that receives admin alerts. */
export const FROM_EMAIL = "zainmuhamad7000@gmail.com";
export const FROM_NAME = "NSAGPT";
export const ADMIN_EMAIL = "zainmuhamad7000@gmail.com";


type MailInput = { to: string; toName?: string; subject: string; html: string };

function wrap(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0f172a;padding:20px 24px;color:#fff;font-size:18px;font-weight:700;">NSAGPT</div>
    <div style="padding:24px;color:#0f172a;font-size:15px;line-height:1.6;">
      <h2 style="margin:0 0 12px;font-size:19px;">${title}</h2>
      ${body}
    </div>
    <div style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;">
      This is an automated message from NSAGPT.
    </div>
  </div></body></html>`;
}

export async function sendMail(input: MailInput): Promise<{ ok: boolean; message?: string }> {
  const key = process.env["BREVO_API_KEY_DIRECT"];
  if (!key) return { ok: false, message: "Email is not configured." };
  const fromEmail = FROM_EMAIL;
  const fromName = FROM_NAME;
  try {
    const res = await fetch(BREVO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json", "api-key": key },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: input.to, ...(input.toName ? { name: input.toName } : {}) }],
        subject: input.subject,
        htmlContent: wrap(input.subject, input.html),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Brevo send failed [${res.status}]: ${body}`);
      return { ok: false, message: `Email failed [${res.status}]: ${body}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("Brevo send error", e);
    return { ok: false, message: e instanceof Error ? e.message : "Email failed." };
  }
}

export function accessRequestEmail(name: string): string {
  return `<p>Hello ${name || "there"},</p>
  <p>We have received your access request for NSAGPT. Our administrator is reviewing it and will contact you shortly with your login details.</p>
  <p>Thank you for your interest.</p>`;
}

export function adminAlertEmail(fields: Record<string, string>): string {
  const rows = Object.entries(fields)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 10px;color:#64748b;">${k}</td><td style="padding:6px 10px;font-weight:600;">${v || "—"}</td></tr>`,
    )
    .join("");
  return `<p>A new access request just arrived.</p><table style="border-collapse:collapse;font-size:14px;">${rows}</table>`;
}

export function accountCreatedEmail(opts: { name: string; email: string; password: string; loginUrl: string }): string {
  return `<p>Hello ${opts.name || "there"},</p>
  <p>Your NSAGPT account has been created. You can sign in right away with the details below:</p>
  <table style="border-collapse:collapse;font-size:14px;margin:8px 0 16px;">
    <tr><td style="padding:6px 10px;color:#64748b;">Email</td><td style="padding:6px 10px;font-weight:600;">${opts.email}</td></tr>
    <tr><td style="padding:6px 10px;color:#64748b;">Password</td><td style="padding:6px 10px;font-weight:600;">${opts.password}</td></tr>
  </table>
  <p><a href="${opts.loginUrl}" style="background:#0f172a;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;">Sign in to NSAGPT</a></p>
  <p style="color:#64748b;font-size:13px;">Please change your password after your first sign-in.</p>`;
}

export function requestApprovedEmail(name: string, loginUrl: string): string {
  return `<p>Hello ${name || "there"},</p>
  <p>Good news — your NSAGPT access request has been approved. If you have not received your login details yet, the administrator will send them shortly.</p>
  <p><a href="${loginUrl}" style="background:#0f172a;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;">Open NSAGPT</a></p>`;
}

export function requestRejectedEmail(name: string): string {
  return `<p>Hello ${name || "there"},</p>
  <p>Thank you for your interest in NSAGPT. After review, your access request could not be approved at this time.</p>
  <p>If you believe this is a mistake, you may reply to this message with more details.</p>`;
}

export function deviceRequestEmail(name: string): string {
  return `<p>Hello ${name || "there"},</p>
  <p>A sign-in attempt was made from a new device or network on your NSAGPT account. For security, the administrator must approve it first.</p>
  <p>You will receive a confirmation once your new device is approved.</p>`;
}

const PLAN_LABELS: Record<string, string> = {
  silver: 'Silver — Weekly (Rs. 399, 1 user)',
  gold: 'Gold — 3 Months (Rs. 4,999, 3 users)',
  diamond: 'Diamond — 1 Year (Rs. 10,500, 5 users)',
};

export function subscriptionRequestEmail(name: string, plan: string): string {
  return `<p>Hello ${name || 'there'},</p>
  <p>We received your request for the <strong>${PLAN_LABELS[plan] ?? plan}</strong> subscription.</p>
  <p>The NSAGPT team will contact you on the details you provided and activate your subscription after confirmation.</p>
  <p>No online payment has been taken.</p>`;
}

export function adminSubscriptionRequestEmail(input: { fullName: string; email: string; phone: string; plan: string; message: string }): string {
  return adminAlertEmail({
    Name: input.fullName,
    Email: input.email,
    'Phone / WhatsApp': input.phone,
    Plan: PLAN_LABELS[input.plan] ?? input.plan,
    Message: input.message,
  });
}

export function subscriptionActivatedEmail(input: { name: string; plan: string; startsAt: string; endsAt: string; userLimit: number; loginUrl: string }): string {
  return `<p>Hello ${input.name || 'there'},</p>
  <p>Your <strong>${PLAN_LABELS[input.plan] ?? input.plan}</strong> subscription is now active.</p>
  <table style="border-collapse:collapse;font-size:14px;margin:8px 0 16px;">
    <tr><td style="padding:6px 10px;color:#64748b;">Starts</td><td style="padding:6px 10px;font-weight:600;">${input.startsAt}</td></tr>
    <tr><td style="padding:6px 10px;color:#64748b;">Ends</td><td style="padding:6px 10px;font-weight:600;">${input.endsAt}</td></tr>
    <tr><td style="padding:6px 10px;color:#64748b;">Users</td><td style="padding:6px 10px;font-weight:600;">${input.userLimit}</td></tr>
  </table>
  <p><a href="${input.loginUrl}" style="background:#0f172a;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;">Open NSAGPT</a></p>`;
}
