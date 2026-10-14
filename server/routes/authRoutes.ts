import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../config/db';
import { generateToken, authenticateToken, type AuthenticatedRequest } from '../middleware/auth';
import { otpService, type OtpPurpose } from '../services/otpService';

const router = Router();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const DEFAULT_EXPENSES = [
  { name: 'Rent', amount: 0, color: '#a78bfa' },
  { name: 'Food', amount: 0, color: '#f472b6' },
  { name: 'Transport', amount: 0, color: '#60a5fa' },
  { name: 'Utilities', amount: 0, color: '#34d399' },
  { name: 'Entertainment', amount: 0, color: '#fbbf24' },
  { name: 'Other', amount: 0, color: '#94a3b8' },
];

function sanitizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    monthlyIncome: user.monthlyIncome,
    totalBalance: user.totalBalance,
    savingsPercent: user.savingsPercent,
    currentPlan: user.currentPlan,
    expenses: user.expenses,
    isOnboarded: user.isOnboarded,
    isAdmin: user.isAdmin,
    statementUploaded: user.statementUploaded,
    statementUploadsCount: user.statementUploadsCount,
    avatarUrl: user.avatarUrl,
  };
}

// POST /api/auth/register
// Initiates registration: validates details and generates an OTP for email verification
router.post('/register', async (req, res: Response) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    // Password policy verification
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number.' });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one special character.' });
    }

    const existingUser = await db.findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate and dispatch OTP
    const otpData = await otpService.createAndSendOtp(
      cleanEmail,
      'signup',
      { name: cleanName, passwordHash },
      cleanName
    );

    return res.status(200).json({
      requiresOtp: true,
      email: cleanEmail,
      purpose: 'signup',
      message: 'Verification code sent to your email. Enter the 6-digit code to complete registration.',
      expiresAt: otpData.expiresAt,
    });
  } catch (error: any) {
    console.error('[Auth] Registration error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
// Verifies credentials, then generates and sends an OTP for 2FA verification
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Valid email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      return res.status(400).json({ error: 'Email and password cannot be empty.' });
    }

    const user = await db.findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password. Please check your credentials or register.' });
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      return res.status(423).json({
        error: `Account is temporarily locked due to multiple failed attempts. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // Check if account has no password set (e.g. Google-only sign-in)
    if (!user.passwordHash || user.passwordHash.trim() === '') {
      if (user.googleId) {
        return res.status(400).json({
          error: 'This account was registered with Google. Please use "Continue with Google" to log in.',
        });
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const isLocked = attempts >= MAX_LOGIN_ATTEMPTS;

      await db.updateUser(cleanEmail, {
        failedLoginAttempts: attempts,
        lockedUntil: isLocked ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null,
      });

      if (isLocked) {
        return res.status(423).json({
          error: 'Too many failed login attempts. Your account has been locked for 15 minutes.',
        });
      }

      return res.status(401).json({
        error: `Invalid email or password. ${MAX_LOGIN_ATTEMPTS - attempts} attempt(s) remaining.`,
      });
    }

    // Password is valid! Generate and send OTP for 2-Factor Authentication
    const otpData = await otpService.createAndSendOtp(cleanEmail, 'login', null, user.name);

    return res.json({
      requiresOtp: true,
      email: cleanEmail,
      purpose: 'login',
      message: 'Security verification code sent to your email. Enter the 6-digit code to sign in.',
      expiresAt: otpData.expiresAt,
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during login.' });
  }
});

// POST /api/auth/google
// Verifies Google OAuth token, then triggers OTP 2-Factor Authentication
router.post('/google', async (req, res: Response) => {
  try {
    const { credential, accessToken } = req.body || {};
    if (!credential && !accessToken) {
      return res.status(400).json({ error: 'Google credential or access token is required.' });
    }

    let payload: any = null;

    if (credential) {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
      const client = new OAuth2Client(clientId);
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId || undefined,
        });
        payload = ticket.getPayload();
      } catch (verifyErr: any) {
        console.error('[Google Auth] Token verification failed:', verifyErr.message);
        return res.status(401).json({ error: 'Failed to verify Google token: ' + verifyErr.message });
      }
    } else if (accessToken) {
      try {
        const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!resp.ok) {
          throw new Error('Google userinfo response status: ' + resp.status);
        }
        payload = await resp.json();
      } catch (fetchErr: any) {
        console.error('[Google Auth] Access token verification failed:', fetchErr.message);
        return res.status(401).json({ error: 'Failed to verify Google access token: ' + fetchErr.message });
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Google account did not provide a valid email address.' });
    }

    const cleanEmail = String(payload.email).trim().toLowerCase();
    const name = payload.name || cleanEmail.split('@')[0];
    const googleId = payload.sub;
    const avatarUrl = payload.picture;

    // Trigger OTP for Google authentication as requested
    const otpData = await otpService.createAndSendOtp(
      cleanEmail,
      'google_auth',
      { name, googleId, avatarUrl },
      name
    );

    return res.json({
      requiresOtp: true,
      email: cleanEmail,
      purpose: 'google_auth',
      message: 'Google identity verified! Enter the 6-digit security code sent to your email to authenticate.',
      expiresAt: otpData.expiresAt,
    });
  } catch (error: any) {
    console.error('[Google Auth] Unexpected error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during Google authentication.' });
  }
});

// POST /api/auth/verify-otp
// Validates OTP for login, signup, or google_auth and completes authentication
router.post('/verify-otp', async (req, res: Response) => {
  try {
    const { email, otp, purpose } = req.body || {};

    if (!email || !otp || !purpose) {
      return res.status(400).json({ error: 'Email, OTP, and verification purpose are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const validPurposes: OtpPurpose[] = ['login', 'signup', 'google_auth'];

    if (!validPurposes.includes(purpose as OtpPurpose)) {
      return res.status(400).json({ error: 'Invalid verification purpose.' });
    }

    const verification = otpService.verifyOtp(cleanEmail, otp, purpose as OtpPurpose);
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error || 'Verification failed.' });
    }

    // Verification succeeded! Complete authentication based on purpose
    let user: any = null;

    if (purpose === 'signup') {
      const { name, passwordHash } = verification.userData || {};
      if (!name || !passwordHash) {
        return res.status(400).json({ error: 'Registration session expired. Please register again.' });
      }

      // Double-check if user was created in the interim
      let existingUser = await db.findUserByEmail(cleanEmail);
      if (existingUser) {
        user = existingUser;
      } else {
        user = await db.createUser({
          email: cleanEmail,
          name,
          passwordHash,
          monthlyIncome: 0,
          totalBalance: 0,
          savingsPercent: 20,
          currentPlan: 'Basic',
          expenses: DEFAULT_EXPENSES,
          isOnboarded: false,
          isAdmin: cleanEmail === 'admin@finsight.com',
          statementUploaded: false,
          statementUploadsCount: 0,
          failedLoginAttempts: 0,
          lockedUntil: null,
        });
      }
    } else if (purpose === 'login') {
      user = await db.findUserByEmail(cleanEmail);
      if (!user) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      // Reset login attempts and lock status
      await db.updateUser(cleanEmail, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
    } else if (purpose === 'google_auth') {
      const { name, googleId, avatarUrl } = verification.userData || {};
      user = await db.findUserByEmail(cleanEmail);

      if (!user) {
        // Create new user via Google
        user = await db.createUser({
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          passwordHash: '',
          googleId,
          avatarUrl,
          monthlyIncome: 0,
          totalBalance: 0,
          savingsPercent: 20,
          currentPlan: 'Basic',
          expenses: DEFAULT_EXPENSES,
          isOnboarded: false,
          isAdmin: cleanEmail === 'admin@finsight.com',
          statementUploaded: false,
          statementUploadsCount: 0,
          failedLoginAttempts: 0,
          lockedUntil: null,
        });
      } else {
        // Update user google info if missing
        if (!user.googleId || !user.avatarUrl) {
          await db.updateUser(cleanEmail, {
            googleId: user.googleId || googleId,
            avatarUrl: user.avatarUrl || avatarUrl,
          });
          user = await db.findUserByEmail(cleanEmail);
        }
      }
    }

    const token = generateToken(user);

    return res.json({
      message: 'Authentication successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    console.error('[Auth] verify-otp error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during verification.' });
  }
});

// POST /api/auth/resend-otp
// Resends OTP code for login, signup, or google_auth
router.post('/resend-otp', async (req, res: Response) => {
  try {
    const { email, purpose } = req.body || {};
    if (!email || !purpose) {
      return res.status(400).json({ error: 'Email and purpose are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const otpData = await otpService.createAndSendOtp(cleanEmail, purpose as OtpPurpose);

    return res.json({
      message: 'A fresh verification code has been dispatched to your email.',
      expiresAt: otpData.expiresAt,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to resend verification code.' });
  }
});

// POST /api/auth/forgot-password/request-otp
// Generates and sends OTP for forgotten password
router.post('/forgot-password/request-otp', async (req, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email address.' });
    }

    const otpData = await otpService.createAndSendOtp(cleanEmail, 'forgot_password', null, user.name);

    return res.json({
      success: true,
      message: 'Password reset code has been sent to your email.',
      email: cleanEmail,
      expiresAt: otpData.expiresAt,
    });
  } catch (error: any) {
    console.error('[Auth] forgot-password/request-otp error:', error);
    return res.status(400).json({ error: error.message || 'Failed to send password reset code.' });
  }
});

// POST /api/auth/forgot-password/reset
// Verifies OTP and resets user password
router.post('/forgot-password/reset', async (req, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body || {};

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one uppercase letter.' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one number.' });
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one special character.' });
    }

    const verification = otpService.verifyOtp(cleanEmail, otp, 'forgot_password');
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error || 'Verification failed.' });
    }

    const user = await db.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and clear any previous lockouts
    await db.updateUser(cleanEmail, {
      passwordHash: newPasswordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('[Auth] forgot-password/reset error:', error);
    return res.status(500).json({ error: error.message || 'Failed to reset password.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user: sanitizeUser(user),
    databaseStatus: db.getStatus(),
  });
});

// POST /api/auth/logout
router.post('/logout', (_req, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

export default router;
