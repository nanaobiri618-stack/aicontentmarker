import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPaymentAlertEmail(params: {
  to: string;
  name: string;
  institution: string;
  amount: number;
}) {
  const { to, name, institution, amount } = params;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px 32px;">
        <h1 style="margin: 0; color: white; font-size: 20px;">AI Content Orchestrator</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #f8fafc; font-size: 18px; margin-bottom: 16px;">Payment Reminder</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Hello <strong style="color: #e2e8f0;">${name}</strong>,
        </p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          This is a reminder that your payment for <strong style="color: #e2e8f0;">${institution}</strong> is currently outstanding.
        </p>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Amount Due</p>
          <p style="margin: 8px 0 0; color: #fbbf24; font-size: 28px; font-weight: bold;">GHS ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Please settle your balance at your earliest convenience to continue enjoying uninterrupted service.
        </p>
        <a href="${process.env.NEXTAUTH_URL || 'https://ai-content-marker.onrender.com'}/auth/signin"
           style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px;">
          Make Payment
        </a>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">
          If you have already made this payment, please disregard this notice. For questions, contact your institution administrator.
        </p>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"AI Content Orchestrator" <${process.env.SMTP_USER}>`,
    to,
    subject: `Payment Reminder — GHS ${amount.toLocaleString()} due for ${institution}`,
    html,
  });

  return info;
}
