import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowLeft, KeyRound, Check, X as XIcon, Eye, EyeOff, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export default function ForgotPasswordPage() {
  const nav = useNavigate();
  const { requestForgotPasswordOtp, resetPasswordWithOtp } = useFinance();

  // Steps: 'request' | 'verify_and_reset' | 'success'
  const [step, setStep] = useState<'request' | 'verify_and_reset' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(25);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password requirements checklist
  const passwordChecks = useMemo(() => [
    { label: 'At least 8 characters', pass: newPassword.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(newPassword) },
    { label: 'One number', pass: /[0-9]/.test(newPassword) },
    { label: 'One special character', pass: /[^A-Za-z0-9]/.test(newPassword) },
    { label: 'Passwords match', pass: newPassword.length > 0 && newPassword === confirmPassword },
  ], [newPassword, confirmPassword]);

  const allPass = passwordChecks.every(c => c.pass);

  // Resend cooldown timer
  useEffect(() => {
    if (step !== 'verify_and_reset' || cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Handle step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const res = await requestForgotPasswordOtp(cleanEmail);
    setLoading(false);

    if (res.success) {
      setStep('verify_and_reset');
      setCooldown(25);
      setInfoMsg(res.message || 'Verification code sent to your email.');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    } else {
      setError(res.error || 'Failed to send verification code.');
    }
  };

  // OTP digit navigation
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (!cleanVal) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    const char = cleanVal.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError('');

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasteData) return;

    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasteData.length; i++) {
      next[i] = pasteData[i];
    }
    setDigits(next);
    setError('');
    const focusIdx = Math.min(5, pasteData.length);
    inputRefs.current[focusIdx]?.focus();
  };


  // Handle step 2: Resend OTP
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setInfoMsg('');
    const res = await requestForgotPasswordOtp(email.trim().toLowerCase());
    setResending(false);

    if (res.success) {
      setInfoMsg(res.message || 'A fresh code was sent to your email.');
      setCooldown(30);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      setError(res.error || 'Failed to resend code.');
    }
  };

  // Handle step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const fullCode = digits.join('');
    if (fullCode.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (!allPass) {
      setError('Please ensure your new password satisfies all security criteria and matches.');
      return;
    }

    setLoading(true);
    const res = await resetPasswordWithOtp(email.trim().toLowerCase(), fullCode, newPassword);
    setLoading(false);

    if (res.success) {
      setStep('success');
    } else {
      setError(res.error || 'Failed to reset password.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: 20 }}>
      <div className="blob blob-1" style={{ width: 600, height: 600, left: '50%', top: '50%', transform: 'translate(-50%,-50%)', animationDelay: '-6s' }} />
      <div className="blob blob-2" style={{ width: 450, height: 450, right: '10%', bottom: '10%' }} />

      <motion.div
        className="panel"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '40px 36px',
          zIndex: 1,
          border: '1px solid rgba(139, 92, 246, 0.25)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
        }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <AnimatePresence mode="wait">
          {step === 'request' && (
            <motion.div
              key="step-request"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a78bfa',
                    marginBottom: 14,
                  }}
                >
                  <KeyRound size={26} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' }}>
                  Reset Password
                </h2>
                <p style={{ color: 'var(--text2)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
                  Enter your registered email address. We'll send you a secure 6-digit verification code.
                </p>
              </div>

              {error && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#fca5a5',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp}>
                <div style={{ marginBottom: 22 }}>
                  <label className="label">Account Email address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="input"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '13px', fontSize: 15, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Sending Security Code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                  Remember your password?{' '}
                  <Link to="/login" style={{ fontWeight: 600, color: 'var(--purple)' }}>
                    Back to Log in
                  </Link>
                </p>
              </form>
            </motion.div>
          )}

          {step === 'verify_and_reset' && (
            <motion.div
              key="step-verify"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a78bfa',
                    marginBottom: 14,
                  }}
                >
                  <ShieldCheck size={26} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.3px' }}>
                  Verify &amp; Reset Password
                </h2>
                <p style={{ color: 'var(--text2)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  Enter the 6-digit code sent to <strong style={{ color: 'var(--text)' }}>{email}</strong>
                </p>
              </div>


              {error && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#fca5a5',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {infoMsg && (
                <div
                  style={{
                    background: 'rgba(52, 211, 153, 0.12)',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    color: '#6ee7b7',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{infoMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword}>
                {/* 6 Digit Inputs */}
                <div style={{ marginBottom: 18 }}>
                  <label className="label" style={{ marginBottom: 8, textAlign: 'center', display: 'block' }}>
                    Enter 6-Digit Verification Code
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    {digits.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleDigitChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        onPaste={i === 0 ? handlePaste : undefined}
                        style={{
                          width: 44,
                          height: 52,
                          textAlign: 'center',
                          fontSize: 22,
                          fontWeight: 700,
                          borderRadius: 8,
                          border: digit
                            ? '2px solid var(--purple)'
                            : '1.5px solid rgba(255, 255, 255, 0.12)',
                          background: digit ? 'rgba(139, 92, 246, 0.08)' : 'var(--panel)',
                          color: 'var(--text)',
                          outline: 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* New Password */}
                <div style={{ marginBottom: 14 }}>
                  <label className="label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      className="input"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text3)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="input"
                  />

                  {/* Password Checklist */}
                  {newPassword.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {passwordChecks.map(c => (
                        <div
                          key={c.label}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            color: c.pass ? 'var(--green)' : 'var(--text3)',
                          }}
                        >
                          {c.pass ? <Check size={14} /> : <XIcon size={14} />}
                          {c.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '13px',
                    fontSize: 15,
                    fontWeight: 600,
                    marginBottom: 16,
                    opacity: allPass && digits.join('').length === 6 && !loading ? 1 : 0.5,
                    cursor: allPass && digits.join('').length === 6 && !loading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  disabled={!allPass || digits.join('').length < 6 || loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Reset & Update Password'
                  )}
                </button>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: 'var(--text2)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => { setStep('request'); setError(''); setInfoMsg(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: 0,
                      fontSize: 13,
                    }}
                  >
                    <ArrowLeft size={14} /> Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || resending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: cooldown > 0 ? 'var(--text2)' : 'var(--purple)',
                      cursor: cooldown > 0 ? 'default' : 'pointer',
                      fontWeight: 600,
                      padding: 0,
                      fontSize: 13,
                      opacity: cooldown > 0 ? 0.6 : 1,
                    }}
                  >
                    {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ textAlign: 'center' }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(52, 211, 153, 0.15)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  marginBottom: 18,
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' }}>
                Password Updated!
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Your password has been successfully reset with 2-factor OTP verification. You can now securely log in to your account.
              </p>

              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', padding: '13px', fontSize: 15, fontWeight: 600 }}
                onClick={() => nav('/login')}
              >
                Proceed to Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
