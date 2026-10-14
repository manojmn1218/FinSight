import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

interface TwilioEmailOptions {
  to: string;
  code: string;
  purposeTitle: string;
  purposeDescription: string;
  name?: string;
}

export class TwilioService {
  private isSendGridConfigured = false;
  private twilioClient: twilio.Twilio | null = null;
  private verifyServiceSid: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // 1. Twilio SendGrid Email API Configuration
    const sendGridKey = process.env.TWILIO_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
    if (sendGridKey) {
      try {
        sgMail.setApiKey(sendGridKey);
        this.isSendGridConfigured = true;
        console.log('📡 [Twilio API] Twilio SendGrid Email Service initialized.');
      } catch (err: any) {
        console.warn('⚠️ [Twilio API] Failed to initialize SendGrid:', err.message);
      }
    }

    // 2. Twilio Client (Verify / REST API) Configuration
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || null;

    if (accountSid && authToken) {
      try {
        this.twilioClient = twilio(accountSid, authToken);
        console.log(`📡 [Twilio API] Twilio Client initialized for Account: ${accountSid.slice(0, 6)}...`);
      } catch (err: any) {
        console.warn('⚠️ [Twilio API] Failed to initialize Twilio client:', err.message);
      }
    }

    if (!this.isSendGridConfigured && !this.twilioClient) {
      console.log('ℹ️  [Twilio API] No Twilio API keys found in .env yet.');
      console.log('💡 [Twilio API] To send live OTP emails via Twilio, add to your .env:');
      console.log('   TWILIO_SENDGRID_API_KEY=SG.your_api_key_here');
      console.log('   TWILIO_EMAIL_FROM=verified_sender@yourdomain.com');
      console.log('   (or TWILIO_ACCOUNT_SID=AC... and TWILIO_AUTH_TOKEN=...)');
    }
  }

  public isAvailable(): boolean {
    return this.isSendGridConfigured || !!this.twilioClient;
  }

  /**
   * Dispatches an OTP email to an email account holder using Twilio SendGrid or Twilio Verify API
   */
  public async sendOtpEmail(options: TwilioEmailOptions): Promise<{ sent: boolean; channel: 'twilio_sendgrid' | 'twilio_verify' | 'failed'; error?: string }> {
    const { to, code, purposeTitle, purposeDescription, name } = options;
    const greeting = name ? `Hello ${name},` : 'Hello,';
    const fromAddress = process.env.TWILIO_EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'security@finsight.com';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0b0f19; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.35); color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 28px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">FinSight</h1>
          <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px; font-weight: 500;">Secured with Twilio API</p>
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
            Dispatched via Twilio API • FinSight Security
          </p>
        </div>
      </div>
    `;

    // 1. Try Twilio SendGrid Email API first
    if (this.isSendGridConfigured) {
      try {
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
      }
    }

    // 2. Try Twilio Verify API if configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID || this.verifyServiceSid;

    if (accountSid && authToken && verifySid) {
      try {
        const client = this.twilioClient || twilio(accountSid, authToken);
        await client.verify.v2.services(verifySid).verifications.create({
          to,
          channel: 'email',
          channelConfiguration: {
            substitutions: {
              code,
            },
          },
        });

        console.log(`✅ [Twilio Verify] Dispatched email verification to ${to} via service ${verifySid}`);
        return { sent: true, channel: 'twilio_verify' };
      } catch (err: any) {
        if (err.code === 60223) {
          console.warn(`ℹ️  [Twilio Verify] Notice for ${to}: Twilio Verify Email Channel requires connecting an email integration (SendGrid) in your Twilio Verify Console.`);
        } else {
          console.warn(`⚠️ [Twilio Verify] Verification error for ${to}:`, err.message);
        }
      }
    }

    return { sent: false, channel: 'failed', error: 'Twilio dispatch unconfigured or failed' };
  }
}

export const twilioService = new TwilioService();
