import { sendOtpEmail } from './emailService';

export type OtpPurpose = 'login' | 'signup' | 'google_auth' | 'forgot_password';

export interface OtpRecord {
  email: string;
  code: string;
  purpose: OtpPurpose;
  userData?: any;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}

class OtpService {
  private store = new Map<string, OtpRecord>();
  private readonly OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  private readonly RESEND_COOLDOWN_MS = 25 * 1000; // 25 seconds
  private readonly MAX_ATTEMPTS = 5;

  private makeKey(email: string, purpose: OtpPurpose): string {
    return `${email.trim().toLowerCase()}:${purpose}`;
  }

  /**
   * Generates a 6-digit numeric code and dispatches it via emailService
   */
  async createAndSendOtp(
    email: string,
    purpose: OtpPurpose,
    userData?: any,
    name?: string
  ): Promise<{ code: string; expiresAt: number; cooldownSeconds: number }> {
    const cleanEmail = email.trim().toLowerCase();
    const key = this.makeKey(cleanEmail, purpose);

    const existing = this.store.get(key);
    const now = Date.now();

    // Check resend cooldown
    if (existing && now - existing.lastSentAt < this.RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((this.RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      throw new Error(`Please wait ${waitSec} seconds before requesting a new code.`);
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + this.OTP_EXPIRY_MS;

    const record: OtpRecord = {
      email: cleanEmail,
      code,
      purpose,
      userData: userData || existing?.userData,
      expiresAt,
      lastSentAt: now,
      attempts: 0,
    };

    this.store.set(key, record);

    // Dispatch OTP via email / log
    await sendOtpEmail({
      to: cleanEmail,
      code,
      purpose,
      name,
    });

    return {
      code,
      expiresAt,
      cooldownSeconds: Math.floor(this.RESEND_COOLDOWN_MS / 1000),
    };
  }

  /**
   * Verifies the provided 6-digit OTP
   */
  verifyOtp(
    email: string,
    code: string,
    purpose: OtpPurpose
  ): { valid: boolean; error?: string; userData?: any } {
    const cleanEmail = email.trim().toLowerCase();
    const key = this.makeKey(cleanEmail, purpose);

    const record = this.store.get(key);

    if (!record) {
      return {
        valid: false,
        error: 'No active verification code found for this account. Please request a new one.',
      };
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      this.store.delete(key);
      return {
        valid: false,
        error: 'This verification code has expired. Please request a new code.',
      };
    }

    if (record.attempts >= this.MAX_ATTEMPTS) {
      this.store.delete(key);
      return {
        valid: false,
        error: 'Too many incorrect attempts. For security reasons, please request a new verification code.',
      };
    }

    const cleanInputCode = String(code).trim().replace(/\s+/g, '');
    if (cleanInputCode !== record.code) {
      record.attempts += 1;
      const remaining = this.MAX_ATTEMPTS - record.attempts;
      return {
        valid: false,
        error: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
      };
    }

    // OTP matched! Remove from store to prevent replay attacks
    const userData = record.userData;
    this.store.delete(key);

    return {
      valid: true,
      userData,
    };
  }

  /**
   * Clears any active OTP for this email & purpose
   */
  clearOtp(email: string, purpose: OtpPurpose): void {
    const key = this.makeKey(email, purpose);
    this.store.delete(key);
  }
}

export const otpService = new OtpService();
