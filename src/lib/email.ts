import nodemailer from 'nodemailer';

// Create transporter with timeout settings for Render deployment
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false,
  },
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development',
});

// Common Email Wrapper Template
const emailLayout = (title: string, content: string) => `
<div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #020617; color: #f8fafc; border-radius: 24px; overflow: hidden; border: 1px solid #1e293b;">
  <div style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 40px; text-align: center;">
    <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">AI CONTENT MARKER</h1>
    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">${title}</p>
  </div>
  <div style="padding: 40px;">
    ${content}
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #1e293b; text-align: center;">
      <p style="margin: 0; color: #64748b; font-size: 12px;">© 2026 AI Content Marker. All rights reserved.</p>
      <p style="margin: 4px 0 0; color: #64748b; font-size: 10px;">Managed by Advanced Agentic Solutions</p>
    </div>
  </div>
</div>
`;

export async function sendPaymentAlertEmail(params: {
  to: string;
  name: string;
  institution: string;
  amount: number;
}) {
  const { to, name, institution, amount } = params;
  const content = `
    <h2 style="color: #f8fafc; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Action Required: Payment Pending</h2>
    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">Your payment for <strong>${institution}</strong> is currently outstanding.</p>
    <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin: 32px 0;">
      <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Amount Due</p>
      <p style="margin: 8px 0 0; color: #fbbf24; font-size: 32px; font-weight: 800;">GHS ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
    </div>
    <a href="${process.env.NEXTAUTH_URL}/auth/signin" style="display: block; background: #38bdf8; color: #020617; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">Complete Payment</a>
  `;
  return transporter.sendMail({
    from: `"AI Content Marker Support" <${process.env.SMTP_USER}>`,
    to,
    subject: `Payment Reminder: GHS ${amount.toLocaleString()} due for ${institution}`,
    html: emailLayout('Financial Status Update', content),
  });
}

export async function sendOrderSuccessEmail(params: {
  to: string;
  name: string;
  productName: string;
  amount: number;
  orderId: number;
}) {
  const { to, name, productName, amount, orderId } = params;
  const content = `
    <h2 style="color: #f8fafc; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Transaction Confirmed</h2>
    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">Hello <strong>${name}</strong>, thank you for your purchase!</p>
    <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin: 32px 0;">
      <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Item: ${productName}</p>
      <p style="margin: 4px 0 0; color: #22c55e; font-size: 24px; font-weight: 800;">GHS ${amount.toLocaleString()}</p>
      <p style="margin: 12px 0 0; color: #64748b; font-size: 11px;">Order Reference: #${orderId}</p>
    </div>
    <p style="color: #94a3b8; font-size: 15px;">Your digital receipt is now available in your dashboard.</p>
    <a href="${process.env.NEXTAUTH_URL}/user" style="display: block; background: #38bdf8; color: #020617; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; margin-top: 24px;">View My Receipt</a>
  `;
  return transporter.sendMail({
    from: `"AI Content Marker" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your Receipt for ${productName} (#${orderId})`,
    html: emailLayout('Payment Receipt', content),
  });
}

export async function sendOwnerOrderAlertEmail(params: {
  to: string;
  customerName: string;
  productName: string;
  amount: number;
  orderId: number;
}) {
  const { to, customerName, productName, amount, orderId } = params;
  const content = `
    <h2 style="color: #f8fafc; font-size: 20px; font-weight: 700; margin-bottom: 16px;">New Order Received</h2>
    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">You have a new transaction for <strong>${productName}</strong>.</p>
    <div style="background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin: 32px 0;">
      <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Customer</p>
      <p style="margin: 4px 0 0; color: #f8fafc; font-size: 18px; font-weight: 700;">${customerName}</p>
      <p style="margin: 12px 0 0; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Inventory Value</p>
      <p style="margin: 4px 0 0; color: #38bdf8; font-size: 24px; font-weight: 800;">GHS ${amount.toLocaleString()}</p>
    </div>
    <p style="color: #94a3b8; font-size: 15px;">Please visit your Command Center to manage delivery and logistics.</p>
    <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: block; background: #8b5cf6; color: white; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; margin-top: 24px;">Open Command Center</a>
  `;
  return transporter.sendMail({
    from: `"AI Alert Service" <${process.env.SMTP_USER}>`,
    to,
    subject: `New Transaction Alert: #${orderId} from ${customerName}`,
    html: emailLayout('Sales Notification', content),
  });
}

export async function sendForwardedComplaintEmail(params: {
  to: string;
  customerName: string;
  subject: string;
  message: string;
}) {
  const { to, customerName, subject, message } = params;
  const content = `
    <h2 style="color: #f8fafc; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Priority Support Ticket</h2>
    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">The Main Administrator has forwarded a priority complaint for your institution.</p>
    <div style="background: #451a03; border: 1px solid #92400e; border-radius: 16px; padding: 24px; margin: 32px 0;">
      <p style="margin: 0; color: #fcd34d; font-size: 11px; text-transform: uppercase; font-weight: 700;">Subject: ${subject}</p>
      <p style="margin: 12px 0 0; color: #f8fafc; font-size: 14px; font-style: italic; line-height: 1.6;">"${message}"</p>
      <p style="margin: 12px 0 0; color: #fcd34d; font-size: 11px;">From Customer: ${customerName}</p>
    </div>
    <p style="color: #94a3b8; font-size: 15px;">Immediate resolution is recommended to maintain platform rating.</p>
    <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: block; background: #e11d48; color: white; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; margin-top: 24px;">Review Ticket</a>
  `;
  return transporter.sendMail({
    from: `"AI Support Link" <${process.env.SMTP_USER}>`,
    to,
    subject: `Forwarded Complaint: ${subject} from ${customerName}`,
    html: emailLayout('Admin Priority Alert', content),
  });
}

export async function sendDeliveryStatusEmail(params: {
  to: string;
  name: string;
  productName: string;
  orderId: number;
}) {
  const { to, name, productName, orderId } = params;
  const content = `
    <h2 style="color: #f8fafc; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Delivery Successful!</h2>
    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">Hello <strong>${name}</strong>, your order for <strong>${productName}</strong> has been marked as delivered.</p>
    <div style="text-align: center; margin: 40px 0;">
      <div style="display: inline-block; width: 64px; height: 64px; background: #22c55e; border-radius: 50%; border: 4px solid #14532d; position: relative;">
        <span style="color: white; font-size: 32px; line-height: 64px;">✓</span>
      </div>
      <p style="color: #22c55e; font-weight: 700; margin-top: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Order Fulfilled</p>
    </div>
    <p style="color: #94a3b8; font-size: 14px; text-align: center;">Reference Order #${orderId}</p>
    <p style="color: #94a3b8; font-size: 15px; margin-top: 24px;">Thank you for shopping with us!</p>
  `;
  return transporter.sendMail({
    from: `"AI Delivery Hub" <${process.env.SMTP_USER}>`,
    to,
    subject: `Order Delivered: ${productName} (#${orderId})`,
    html: emailLayout('Fulfillment Update', content),
  });
}
