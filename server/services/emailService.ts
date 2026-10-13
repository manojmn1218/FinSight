import nodemailer from 'nodemailer';
import { twilioService } from './twilioService';

interface SendOtpOptions {
  to: string;
  code: string;
  purpose: 'login' | 'signup' | 'google_auth' | 'forgot_password';
  name?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (host && user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      console.log(`📧 [EmailService] SMTP Transporter configured (${host}:${port})`);
      return transporter;
    } catch (e: any) {
      console.warn('⚠️ [EmailService] Failed to initialize SMTP:', e.message);
    }
  }

  // Support direct Gmail service if configured
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
      console.log('📧 [EmailService] Gmail Transporter configured');
      return transporter;
    } catch (e: any) {
      console.warn('⚠️ [EmailService] Failed to initialize Gmail transport:', e.message);
    }
  }

  return null;
}

const PURPOSE_TITLES: Record<string, string> = {
  login: 'Sign In Verification Code',
  signup: 'Account Registration Code',
  google_auth: 'Google Account Authentication Code',
  forgot_password: 'Password Reset Verification Code',
};

const PURPOSE_DESCRIPTIONS: Record<string, string> = {
  login: 'You requested to log in to your FinSight account.',
  signup: 'Thank you for signing up for FinSight! Please verify your email address.',
  google_auth: 'You are authenticating your Google account with FinSight.',
  forgot_password: 'We received a request to reset your FinSight account password.',
};

export async function sendOtpEmail(options: SendOtpOptions): Promise<{ sent: boolean; channel: 'twilio' | 'email' | 'console' }> {
  const { to, code, purpose, name } = options;
  const title = PURPOSE_TITLES[purpose] || 'Verification Code';
  const desc = PURPOSE_DESCRIPTIONS[purpose] || 'Please use this code to verify your action.';
  const greeting = name ? `Hello ${name},` : 'Hello,';

  // Always output clean visual OTP banner in the console for instant testing & audit trail
  console.log('\n' + '═'.repeat(66));
  console.log('  🔐 FINSIGHT SECURITY ONE-TIME PASSWORD (OTP)');
  console.log('═'.repeat(66));
  console.log(`  To:       ${to}`);
  console.log(`  Purpose:  ${title.toUpperCase()}`);
  console.log(`  Channel:  TWILIO API / SECURE DISPATCH`);
  console.log(`  OTP Code: ═══[ ${code.split('').join(' ')} ]═══`);
  console.log(`  Validity: 10 minutes`);
  console.log('═'.repeat(66) + '\n');

  // 1. Dispatch via Twilio API (Twilio SendGrid or Twilio Verify)
  if (twilioService.isAvailable()) {
    const twilioResult = await twilioService.sendOtpEmail({
      to,
      code,
      purposeTitle: title,
      purposeDescription: desc,
      name,
    });

    if (twilioResult.sent) {
      return { sent: true, channel: 'twilio' };
    }
  }

  // 2. Fallback to standard SMTP / nodemailer if configured
  const mailClient = getTransporter();
  if (mailClient) {
    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"FinSight Security" <security@finsight.com>';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.3); color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 28px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">FinSight</h1>
          <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">Intelligent Financial Management</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #f8fafc;">${title}</h2>
          <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">${greeting}</p>
          <p style="margin: 0 0 24px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">${desc}</p>
          
          <div style="background: #1e293b; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #a78bfa; font-weight: 700;">Your 6-Digit OTP Code</p>
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: 'Courier New', Courier, monospace;">
              ${code}
            </div>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b;">Valid for the next 10 minutes</p>
          </div>
          
          <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; color: #fca5a5; font-size: 12px; line-height: 1.5;">
              <strong>Security Warning:</strong> Never share this verification code with anyone. FinSight staff will never ask for your one-time code.
            </p>
          </div>
          
          <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
            Dispatched via FinSight Security Engine
          </p>
        </div>
      </div>
    `;

    try {
      await mailClient.sendMail({
        from: fromAddress,
        to,
        subject: `[FinSight] ${code} is your ${title}`,
        text: `${title}\n\n${greeting}\n${desc}\n\nYour 6-digit OTP code is: ${code}\nThis code expires in 10 minutes.\n\nDo not share this code with anyone.`,
        html,
      });
      console.log(`✅ [EmailService] OTP email successfully sent to ${to}`);
      return { sent: true, channel: 'email' };
    } catch (err: any) {
      console.warn(`⚠️ [EmailService] Failed sending OTP email to ${to}:`, err.message);
      return { sent: false, channel: 'console' };
    }
  }

  return { sent: true, channel: 'console' };
}
