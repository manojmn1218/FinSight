// ═══════════════════════════════════════════════
// Bank Connect — Setu AA Integration UI Component
// ═══════════════════════════════════════════════
//
// Multi-step modal for connecting bank accounts via Setu AA.
// Steps: Input Phone → Consent Redirect → Fetching → Success

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Phone, ArrowRight, Loader2, CheckCircle2, AlertCircle, Shield, X, Landmark, RefreshCw, ExternalLink, Wifi } from 'lucide-react';
import { createConsent, fetchBankData } from '../utils/setuApi';
import type { BankDataResult } from '../utils/setuApi';

interface BankConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: BankDataResult) => void;
}

type Step = 'input' | 'consent' | 'fetching' | 'success' | 'error';

export default function BankConnect({ isOpen, onClose, onSuccess }: BankConnectProps) {
  const [step, setStep] = useState<Step>(() => {
    if (typeof window === 'undefined') return 'input';
    const params = new URLSearchParams(window.location.search);
    const setuConsent = params.get('setu_consent');
    const cId = params.get('consentId');
    if (setuConsent && cId && (setuConsent === 'mock_approved' || setuConsent === 'callback')) {
      return 'fetching';
    }
    return 'input';
  });
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [consentId, setConsentId] = useState(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const setuConsent = params.get('setu_consent');
    const cId = params.get('consentId');
    if (setuConsent && cId && (setuConsent === 'mock_approved' || setuConsent === 'callback')) {
      return cId;
    }
    return '';
  });
  const [fetchResult, setFetchResult] = useState<BankDataResult | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setStep('input');
      setPhone('');
      setError('');
      setConsentId('');
      setFetchResult(null);
      setStatusMsg('');
    }
  }

  // Clean URL params on mount if returned from Setu
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('setu_consent')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Handle phone submit → create consent
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setError('');
    setStep('consent');
    setStatusMsg('Creating consent request…');

    try {
      const result = await createConsent(cleaned);
      setConsentId(result.consentId);

      // Check if redirect URL points to current origin (mock mode)
      const redirectUrl = result.redirectUrl;
      if (redirectUrl.startsWith(window.location.origin)) {
        // Mock mode — simulate user approving consent
        setStatusMsg('Simulating consent approval (dev mode)…');
        await new Promise(r => setTimeout(r, 1500));
        setStep('fetching');
      } else {
        // Real mode — redirect to Setu consent screens
        setStatusMsg('Redirecting to consent approval…');
        window.location.href = redirectUrl;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create consent request.';
      setError(msg);
      setStep('error');
    }
  }, [phone]);

  // Fetch data when in fetching step
  useEffect(() => {
    if (step !== 'fetching' || !consentId) return;

    let cancelled = false;

    async function doFetch() {
      try {
        setStatusMsg('Fetching your bank transactions…');

        const result = await fetchBankData(consentId);

        if (cancelled) return;

        if (result.transactions.length === 0) {
          setError('No transactions found in the response. The bank may not have returned data.');
          setStep('error');
          return;
        }

        setFetchResult(result);
        setStep('success');
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to fetch bank data.';
        setError(msg);
        setStep('error');
      }
    }

    doFetch();
    return () => { cancelled = true; };
  }, [step, consentId]);

  // Import transactions on success confirmation
  const handleImport = useCallback(() => {
    if (fetchResult) {
      onSuccess(fetchResult);
      onClose();
    }
  }, [fetchResult, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <motion.div
          className="panel"
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{
            width: 480, maxWidth: '92vw', maxHeight: '85vh',
            position: 'relative', overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header gradient */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(129,140,248,0.12), rgba(167,139,250,0.08))',
            padding: '28px 28px 20px',
            borderBottom: '1px solid var(--border)',
          }}>
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                borderRadius: 8, width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text2)', cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(96,165,250,0.25)',
              }}>
                <Landmark size={24} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 2 }}>Connect Bank Account</h2>
                <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                  Securely fetch transactions via RBI Account Aggregator
                </p>
              </div>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {['Verify Phone', 'Give Consent', 'Fetch Data', 'Done'].map((label, i) => {
                const steps: Step[] = ['input', 'consent', 'fetching', 'success'];
                const stepIdx = steps.indexOf(step === 'error' ? 'input' : step);
                const done = i < stepIdx;
                const active = i === stepIdx;
                return (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{
                      height: 3, borderRadius: 2,
                      background: done ? '#34d399' : active ? '#818cf8' : 'rgba(255,255,255,0.06)',
                      transition: 'background 0.3s',
                    }} />
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      color: done ? '#34d399' : active ? '#818cf8' : 'var(--text3)',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 28px 28px' }}>
            <AnimatePresence mode="wait">
              {/* ─── Step: Input ─── */}
              {step === 'input' && (
                <motion.div key="input" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                  <form onSubmit={handleSubmit}>
                    <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18, lineHeight: 1.6 }}>
                      Enter the mobile number linked to your bank account. You'll be redirected to a secure consent screen to approve data sharing.
                    </p>

                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text)' }}>
                      <Phone size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                      Mobile Number
                    </label>
                    <div style={{ position: 'relative', marginBottom: 6 }}>
                      <span style={{
                        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 14, fontWeight: 600, color: 'var(--text2)', pointerEvents: 'none',
                      }}>+91</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        autoFocus
                        className="input"
                        style={{ paddingLeft: 48, fontSize: 15, fontWeight: 500, letterSpacing: 0.5 }}
                      />
                    </div>

                    {error && (
                      <div style={{
                        padding: '8px 12px', background: 'rgba(248,113,113,0.08)',
                        color: '#f87171', borderRadius: 8, fontSize: 12, fontWeight: 500,
                        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <AlertCircle size={13} /> {error}
                      </div>
                    )}

                    {/* Trust badges */}
                    <div style={{
                      display: 'flex', gap: 16, marginTop: 16, marginBottom: 20,
                      padding: '12px 14px', background: 'rgba(52,211,153,0.04)',
                      borderRadius: 10, border: '1px solid rgba(52,211,153,0.08)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text2)' }}>
                        <Shield size={13} color="#34d399" /> RBI Regulated
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text2)' }}>
                        <Wifi size={13} color="#34d399" /> End-to-End Encrypted
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text2)' }}>
                        <Building2 size={13} color="#34d399" /> Bank-grade Security
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 600 }}
                      disabled={phone.replace(/\D/g, '').length !== 10}
                    >
                      Connect My Account <ArrowRight size={16} />
                    </button>

                    <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                      By proceeding, you agree to share your bank transaction data with FinSight via the RBI Account Aggregator framework. You can revoke access anytime.
                    </p>
                  </form>
                </motion.div>
              )}

              {/* ─── Step: Consent (loading/redirect) ─── */}
              {step === 'consent' && (
                <motion.div key="consent" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                  style={{ textAlign: 'center', padding: '32px 0' }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                    background: 'rgba(129,140,248,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Loader2 size={28} color="var(--purple)" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Setting up secure connection…</h3>
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{statusMsg}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
                    <ExternalLink size={12} /> You may be redirected to approve consent
                  </div>
                </motion.div>
              )}

              {/* ─── Step: Fetching ─── */}
              {step === 'fetching' && (
                <motion.div key="fetching" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                  style={{ textAlign: 'center', padding: '32px 0' }}
                >
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                    background: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(167,139,250,0.12))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <Landmark size={28} color="#818cf8" />
                    {/* Animated ring */}
                    <div style={{
                      position: 'absolute', inset: -4,
                      border: '2px solid transparent', borderTopColor: '#818cf8',
                      borderRadius: '50%', animation: 'spin 1.5s linear infinite',
                    }} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Fetching your transactions…</h3>
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>{statusMsg}</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>This may take a few seconds</p>

                  {/* Skeleton loading bars */}
                  <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[90, 75, 60, 82, 55].map((w, i) => (
                      <div key={i} style={{
                        height: 12, borderRadius: 6,
                        width: `${w}%`, margin: '0 auto',
                        background: 'linear-gradient(90deg, rgba(129,140,248,0.08), rgba(129,140,248,0.16), rgba(129,140,248,0.08))',
                        backgroundSize: '200% 100%',
                        animation: `shimmer 1.5s ease-in-out infinite ${i * 0.15}s`,
                      }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ─── Step: Success ─── */}
              {step === 'success' && fetchResult && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                      background: 'rgba(52,211,153,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CheckCircle2 size={32} color="#34d399" />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Data Retrieved Successfully!</h3>
                    <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                      Found <strong>{fetchResult.transactions.length}</strong> transactions ready to import
                    </p>
                  </div>

                  {/* Account info */}
                  {fetchResult.accountInfo && (
                    <div style={{
                      padding: '14px 16px', borderRadius: 12,
                      background: 'rgba(129,140,248,0.04)',
                      border: '1px solid rgba(129,140,248,0.1)',
                      marginBottom: 16,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'rgba(129,140,248,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Building2 size={18} color="#818cf8" />
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                              {fetchResult.accountInfo.maskedAccNumber}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text3)' }}>
                              {fetchResult.accountInfo.accountType} · {fetchResult.accountInfo.branch || 'Bank Account'}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>
                            ₹{fetchResult.accountInfo.balance.toLocaleString('en-IN')}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>Balance</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {[
                      {
                        label: 'Credits',
                        value: fetchResult.transactions.filter(t => t.amount > 0).length,
                        color: '#34d399',
                      },
                      {
                        label: 'Debits',
                        value: fetchResult.transactions.filter(t => t.amount < 0).length,
                        color: '#f472b6',
                      },
                      {
                        label: 'Categories',
                        value: new Set(fetchResult.transactions.map(t => t.category)).size,
                        color: '#818cf8',
                      },
                    ].map(s => (
                      <div key={s.label} style={{
                        textAlign: 'center', padding: '12px 8px',
                        background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                        border: '1px solid var(--border)',
                      }}>
                        <p style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
                        <p style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleImport}
                    className="btn-primary"
                    style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 600 }}
                  >
                    <CheckCircle2 size={16} /> Import {fetchResult.transactions.length} Transactions
                  </button>
                </motion.div>
              )}

              {/* ─── Step: Error ─── */}
              {step === 'error' && (
                <motion.div key="error" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                  style={{ textAlign: 'center', padding: '28px 0' }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                    background: 'rgba(248,113,113,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <AlertCircle size={28} color="#f87171" />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h3>
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.5, maxWidth: 340, margin: '0 auto 20px' }}>
                    {error}
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button
                      onClick={() => { setStep('input'); setError(''); }}
                      className="btn-primary"
                      style={{ padding: '10px 24px', fontSize: 13 }}
                    >
                      <RefreshCw size={14} /> Try Again
                    </button>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: '10px 24px', fontSize: 13 }}>
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Shimmer animation CSS */}
          <style>{`
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
