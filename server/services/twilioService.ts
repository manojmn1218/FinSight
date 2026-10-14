import sgMail from '@sendgrid/mail';

interface TwilioEmailOptions {
  to: string;
  code: string;
  purposeTitle: string;
  purposeDescription: string;
  name?: string;
}

export class TwilioService {
  private isSendGridConfigured = false;

  constructor() {
    this.init();
  }

  private init() {
    const sendGridKey = process.env.TWILIO_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
    if (sendGridKey) {
      try {
        sgMail.setApiKey(sendGridKey);
        this.isSendGridConfigured = true;
        console.log('📡 [Twilio SendGrid] Email Service initialized.');
      } catch (err: any) {
        console.warn('⚠️ [Twilio SendGrid] Failed to initialize SendGrid:', err.message);
      }
    } else {
      console.log('ℹ️  [Twilio SendGrid] No TWILIO_SENDGRID_API_KEY found in .env.');
    }
  }

  public isAvailable(): boolean {
    return Boolean(process.env.TWILIO_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY);
  }

  /**
   * Dispatches an OTP email directly to an account holder using Twilio SendGrid Email API
   */
  public async sendOtpEmail(options: TwilioEmailOptions): Promise<{ sent: boolean; channel: 'twilio_sendgrid' | 'failed'; error?: string }> {
    const { to, code, purposeTitle, purposeDescription, name } = options;
    const greeting = name ? `Hello ${name},` : 'Hello,';
    const fromAddress = process.env.TWILIO_EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'security@finsight.com';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0b0f19; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.35); color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 28px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">FinSight</h1>
          <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">Secured with Twilio SendGrid API</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #f8fafc;">${purposeTitle}</h2>
          <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">${greeting}</p>
          <p style="margin: 0 0 24px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">${purposeDescription}</p>
          
          <div style="background: #111827; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #a78bfa; font-weight: 700;">Your 6-Digit OTP Code</p>
            <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; font-family: 'Courier New', Courier, monospace;">
              ${code}
            </div>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b;">Valid for the next 10 minutes</p>
          </div>
          
          <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; color: #fca5a5; font-size: 12px; line-height: 1.5;">
              <strong>Security Warning:</strong> Never share this verification code with anyone. FinSight will never ask for your code.
            </p>
          </div>
          
          <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
            Dispatched via Twilio SendGrid API • FinSight Security
          </p>
        </div>
      </div>
    `;

    const sendGridKey = process.env.TWILIO_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
    if (sendGridKey) {
      try {
        sgMail.setApiKey(sendGridKey);
        await sgMail.send({
          to,
          from: fromAddress,
          subject: `[FinSight] ${code} is your ${purposeTitle}`,
          text: `${purposeTitle}\n\n${greeting}\n${purposeDescription}\n\nYour 6-digit OTP code is: ${code}\nThis code expires in 10 minutes.\n\nDo not share this code with anyone.`,
          html: htmlContent,
        });

        console.log(`✅ [Twilio SendGrid] Successfully delivered OTP email to ${to}`);
        return { sent: true, channel: 'twilio_sendgrid' };
      } catch (err: any) {
        console.error(`⚠️ [Twilio SendGrid] Delivery error to ${to}:`, err.response?.body || err.message);
        return { sent: false, channel: 'failed', error: err.message };
      }
    }

    return { sent: false, channel: 'failed', error: 'Twilio SendGrid unconfigured' };
  }
}

export const twilioService = new TwilioService();
