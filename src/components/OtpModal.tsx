import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowLeft, RefreshCw, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface OtpModalProps {
  isOpen: boolean;
  email: string;
  purpose: 'login' | 'signup' | 'google_auth';
  otpPreview?: string;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onResend: () => Promise<{ success: boolean; message?: string; otpPreview?: string; error?: string }>;
  onCancel: () => void;
}

export default function OtpModal({
  isOpen,
  email,
  purpose,
  otpPreview: initialOtpPreview,
  onVerify,
  onResend,
  onCancel,
}: OtpModalProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(25);
  const [otpPreview, setOtpPreview] = useState(initialOtpPreview || '');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setOtpPreview(initialOtpPreview || '');
  }, [initialOtpPreview]);

  // Reset inputs when opened
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError('');
      setInfoMsg('');
      setCooldown(25);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (!isOpen || cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, cooldown]);

  const handleChange = (index: number, val: string) => {
    // Only accept numeric characters
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (!cleanVal) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Single character input
    const char = cleanVal.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError('');

    // Advance to next box
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

    if (pasteData.length === 6) {
      handleAutoSubmit(pasteData);
    }
  };


  const handleAutoSubmit = async (fullCode: string) => {
    setLoading(true);
    setError('');
    const res = await onVerify(fullCode);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Invalid verification code.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setError('');
    const res = await onVerify(fullCode);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Invalid verification code.');
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setInfoMsg('');
    const res = await onResend();
    setResending(false);
    if (res.success) {
      setInfoMsg(res.message || 'A fresh verification code was sent.');
      if (res.otpPreview) {
        setOtpPreview(res.otpPreview);
      }
      setCooldown(30);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      setError(res.error || 'Failed to resend code.');
    }
  };

  if (!isOpen) return null;

  const purposeLabels: Record<string, { title: string; subtitle: string }> = {
    login: {
      title: 'Two-Factor Authentication',
      subtitle: `Enter the 6-digit verification code sent to ${email} to sign in.`,
    },
    signup: {
      title: 'Verify Your Email Address',
      subtitle: `We sent a 6-digit confirmation code to ${email} to activate your account.`,
    },
    google_auth: {
      title: 'Google Security Check',
      subtitle: `Please enter the 6-digit code sent to your Google account (${email}).`,
    },
  };

  const { title, subtitle } = purposeLabels[purpose] || {
    title: 'Security Verification',
    subtitle: `Enter the 6-digit code sent to ${email}`,
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(5, 7, 15, 0.82)',
          backdropFilter: 'blur(8px)',
          padding: 16,
        }}
      >
        <motion.div
          className="panel"
          style={{
            width: '100%',
            maxWidth: 460,
            padding: '36px 32px',
            position: 'relative',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
          }}
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
                marginBottom: 16,
              }}
            >
              <ShieldCheck size={28} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>
              {title}
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
              {subtitle}
            </p>
          </div>


          {/* Error & Info Alerts */}
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

          {infoMsg && (
            <div
              style={{
                background: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                color: '#6ee7b7',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 24,
              }}
            >
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  style={{
                    width: 48,
                    height: 56,
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: 700,
                    borderRadius: 10,
                    border: digit
                      ? '2px solid var(--purple)'
                      : '1.5px solid rgba(255, 255, 255, 0.12)',
                    background: digit ? 'rgba(139, 92, 246, 0.08)' : 'var(--panel)',
                    color: 'var(--text)',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || digits.join('').length < 6}
              style={{
                width: '100%',
                padding: '13px',
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Verifying Code...
                </>
              ) : (
                'Verify & Proceed'
              )}
            </button>

            {/* Resend and Cancel */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13,
                color: 'var(--text2)',
                marginTop: 12,
              }}
            >
              <button
                type="button"
                onClick={onCancel}
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
                <ArrowLeft size={14} /> Back
              </button>

              <button
                type="button"
                onClick={handleResendClick}
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
      </div>
    </AnimatePresence>
  );
}
