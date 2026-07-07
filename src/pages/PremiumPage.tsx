import React, { useState, useCallback } from 'react';
import { Check, X, Crown, Sparkles, Zap, Shield, Star, ArrowRight, ChevronDown, CreditCard, TrendingUp, BarChart3, Target, Download, Bell, Lock, Cpu, Users, Smartphone, Building2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';

// ─── Plan data ───
const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    priceLabel: 'Free',
    priceYearly: 0,
    desc: 'Essential tools to get started with personal finance tracking.',
    icon: BarChart3,
    color: '#94a3b8',
    features: [
      { text: 'Manual expense entry', included: true },
      { text: 'Basic dashboard & charts', included: true },
      { text: 'Up to 3 PDF uploads/month', included: true },
      { text: 'Standard categories', included: true },
      { text: 'CSV export', included: true },
      { text: 'AI-powered insights', included: false },
      { text: 'Recurring payment alerts', included: false },
      { text: 'Budget health scoring', included: false },
      { text: 'Priority support', included: false },
      { text: 'Investment tracking', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 349,
    priceLabel: '₹349',
    priceYearly: 3490,
    desc: 'Advanced AI analytics, unlimited uploads, and smart automation.',
    icon: Zap,
    color: '#818cf8',
    popular: true,
    features: [
      { text: 'Everything in Basic', included: true },
      { text: 'Unlimited PDF uploads', included: true },
      { text: 'AI-powered smart insights', included: true },
      { text: 'Recurring payment detection & alerts', included: true },
      { text: 'Budget health score & gauge', included: true },
      { text: 'Custom categories & rules', included: true },
      { text: 'Advanced monthly summaries', included: true },
      { text: 'Export CSV, PDF & Excel', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Investment tracking', included: false },
    ],
  },
  {
    id: 'wealth',
    name: 'Wealth',
    price: 899,
    priceLabel: '₹899',
    priceYearly: 8990,
    desc: 'For serious investors — portfolio tracking, crypto, and personal advisor.',
    icon: Crown,
    color: '#f0b429',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Investment & portfolio tracking', included: true },
      { text: 'Crypto wallet integration', included: true },
      { text: 'Net worth dashboard', included: true },
      { text: 'Tax optimization suggestions', included: true },
      { text: 'Shared family accounts', included: true },
      { text: 'API access & webhooks', included: true },
      { text: '1-on-1 financial advisor/month', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'White-glove onboarding', included: true },
    ],
  },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Freelance Designer', text: 'FinSight Pro completely changed how I manage my money. The AI insights caught ₹4,000/month in forgotten subscriptions!', avatar: '👩‍💻' },
  { name: 'Rahul Mehra', role: 'Startup Founder', text: 'The recurring payment alerts alone saved me ₹15,000 in a quarter. Worth every rupee of the Pro subscription.', avatar: '👨‍💼' },
  { name: 'Ananya Reddy', role: 'Software Engineer', text: 'I love the budget health score. It gamifies saving money and keeps me motivated to hit my financial goals.', avatar: '👩‍🔬' },
];

const FAQS = [
  { q: 'Can I switch between plans anytime?', a: 'Yes! You can upgrade or downgrade at any time. When upgrading, you\'ll be charged the prorated amount. When downgrading, the remaining balance carries forward as credits.' },
  { q: 'Is my financial data secure?', a: 'Absolutely. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never share your data with third parties. PDF processing happens locally in your browser — your bank statements never touch our servers.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards (Visa, Mastercard, RuPay), UPI, net banking, and popular wallets like Paytm, PhonePe, and Google Pay.' },
  { q: 'Do you offer refunds?', a: 'Yes, we offer a 14-day money-back guarantee on all paid plans. If you\'re not satisfied, contact support for a full refund — no questions asked.' },
  { q: 'What happens to my data if I downgrade?', a: 'Your data is never deleted. If you downgrade to Basic, you\'ll retain read access to all your historical data. Some premium features like AI insights will become read-only.' },
];

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

// ─── Payment Method Types ───
type PaymentMethod = 'upi' | 'card' | 'netbanking';
type CheckoutStep = 'select' | 'processing' | 'success' | 'failed';

// ─── Card number formatter (adds spaces every 4 digits) ───
function formatCardNumber(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

// ═══════════════════════════════════════════════
// PAYMENT CHECKOUT MODAL
// ═══════════════════════════════════════════════
function CheckoutModal({
  plan,
  billing,
  onClose,
  onSuccess,
}: {
  plan: typeof PLANS[0];
  billing: 'monthly' | 'yearly';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const price = billing === 'yearly' ? plan.priceYearly : plan.price;
  const monthlyPrice = billing === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.price;
  const total = price;

  const [step, setStep] = useState<CheckoutStep>('select');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [error, setError] = useState('');

  // UPI state
  const [upiId, setUpiId] = useState('');

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Net banking state
  const [selectedBank, setSelectedBank] = useState('');

  const BANKS = [
    { id: 'sbi', name: 'State Bank of India', icon: '🏦' },
    { id: 'hdfc', name: 'HDFC Bank', icon: '🏛️' },
    { id: 'icici', name: 'ICICI Bank', icon: '🏢' },
    { id: 'axis', name: 'Axis Bank', icon: '🏗️' },
    { id: 'kotak', name: 'Kotak Mahindra', icon: '🏘️' },
    { id: 'bob', name: 'Bank of Baroda', icon: '🏫' },
  ];

  // ── Validate & Pay ──
  const handlePay = useCallback(() => {
    setError('');

    if (method === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g., name@upi)');
        return;
      }
    } else if (method === 'card') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 15) {
        setError('Please enter a valid card number');
        return;
      }
      if (!cardName.trim()) {
        setError('Please enter the cardholder name');
        return;
      }
      const expiryParts = cardExpiry.split('/');
      if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
        setError('Please enter a valid expiry date (MM/YY)');
        return;
      }
      const month = parseInt(expiryParts[0]);
      if (month < 1 || month > 12) {
        setError('Invalid expiry month');
        return;
      }
      if (cardCvv.length < 3) {
        setError('Please enter a valid CVV');
        return;
      }
    } else if (method === 'netbanking') {
      if (!selectedBank) {
        setError('Please select a bank');
        return;
      }
    }

    // Start processing
    setStep('processing');

    // Simulate payment processing with stages
    setTimeout(() => {
      // 95% success rate simulation
      const success = Math.random() > 0.05;
      if (success) {
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 2500);
      } else {
        setStep('failed');
      }
    }, 3000);
  }, [method, upiId, cardNumber, cardName, cardExpiry, cardCvv, selectedBank, onSuccess]);

  const PlanIcon = plan.icon;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        onClick={step === 'processing' ? undefined : onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="panel"
        style={{
          position: 'relative', width: 520, maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* ── Step: Select Payment ── */}
        {step === 'select' && (
          <>
            {/* Header */}
            <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Checkout</p>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>Upgrade to {plan.name}</h2>
              </div>
              <button onClick={onClose} className="btn-ghost" style={{ padding: 6 }}><X size={20} /></button>
            </div>

            {/* Order Summary */}
            <div style={{ margin: '20px 28px', padding: 16, borderRadius: 'var(--radius-sm)', background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${plan.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlanIcon size={20} color={plan.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>FinSight {plan.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {billing === 'yearly' ? `Yearly plan (₹${monthlyPrice}/mo)` : 'Monthly plan'}
                  </p>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{fmt(price)}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: plan.color }}>{fmt(total)}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div style={{ padding: '0 28px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Payment Method</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {([
                  { id: 'upi' as PaymentMethod, label: 'UPI', icon: Smartphone, sub: 'GPay, PhonePe, Paytm' },
                  { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard, sub: 'Visa, Mastercard, RuPay' },
                  { id: 'netbanking' as PaymentMethod, label: 'Net Banking', icon: Building2, sub: 'All major banks' },
                ]).map(m => {
                  const Icon = m.icon;
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setMethod(m.id); setError(''); }}
                      style={{
                        flex: 1, padding: '14px 12px', borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${active ? plan.color : 'var(--border)'}`,
                        background: active ? `${plan.color}0a` : 'transparent',
                        cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Icon size={20} color={active ? plan.color : 'var(--text3)'} style={{ margin: '0 auto 6px', display: 'block' }} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--text)' : 'var(--text2)' }}>{m.label}</p>
                      <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{m.sub}</p>
                    </button>
                  );
                })}
              </div>

              {/* UPI Form */}
              {method === 'upi' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <label className="label">UPI ID</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    style={{ marginBottom: 12 }}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                      <span key={app} style={{
                        padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                        background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)',
                      }}>
                        {app}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Card Form */}
              {method === 'card' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <div>
                    <label className="label">Card Number</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <label className="label">Cardholder Name</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Name on card"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label className="label">Expiry</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="label">CVV</label>
                      <input
                        type="password"
                        className="input"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
                    <Lock size={11} />
                    <span>Your card info is encrypted and never stored on our servers</span>
                  </div>
                </motion.div>
              )}

              {/* Net Banking Form */}
              {method === 'netbanking' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <label className="label">Select Your Bank</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {BANKS.map(bank => {
                      const active = selectedBank === bank.id;
                      return (
                        <button
                          key={bank.id}
                          onClick={() => setSelectedBank(bank.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                            border: `1.5px solid ${active ? plan.color : 'var(--border)'}`,
                            background: active ? `${plan.color}0a` : 'transparent',
                            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span style={{ fontSize: 20 }}>{bank.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? 'var(--text)' : 'var(--text2)' }}>
                            {bank.name}
                          </span>
                          {active && <Check size={14} color={plan.color} style={{ marginLeft: 'auto' }} />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginTop: 14, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
                      fontSize: 13, color: 'var(--red)',
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pay Button */}
            <div style={{ padding: '20px 28px 28px' }}>
              <button onClick={handlePay} className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 15 }}>
                <Lock size={15} /> Pay {fmt(total)}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 14 }}>
                <span style={{ fontSize: 10, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Shield size={10} /> 256-bit SSL
                </span>
                <span style={{ fontSize: 10, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Lock size={10} /> PCI DSS Compliant
                </span>
                <span style={{ fontSize: 10, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={10} /> 14-day refund
                </span>
              </div>
            </div>
          </>
        )}

        {/* ── Step: Processing ── */}
        {step === 'processing' && (
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            {/* Animated spinner */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 28px',
              border: '3px solid var(--border)',
              borderTopColor: plan.color,
              animation: 'spin 1s linear infinite',
            }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Processing Payment</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
              Please wait while we securely process your payment…
            </p>

            {/* Processing stages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280, margin: '0 auto' }}>
              {[
                { text: 'Verifying payment details', delay: 0 },
                { text: 'Connecting to payment gateway', delay: 800 },
                { text: 'Processing transaction', delay: 1600 },
              ].map((stage, i) => (
                <ProcessingStage key={i} text={stage.text} delay={stage.delay} color={plan.color} />
              ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 24 }}>
              Do not close this window or press back
            </p>
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ padding: '60px 40px', textAlign: 'center' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
                background: 'rgba(52,211,153,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={40} color="#34d399" />
            </motion.div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Payment Successful! 🎉</h3>
            <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 8 }}>
              Welcome to FinSight <span style={{ color: plan.color, fontWeight: 700 }}>{plan.name}</span>
            </p>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 28 }}>
              Amount paid: <strong>{fmt(total)}</strong> · Receipt sent to your email
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300, margin: '0 auto' }}>
              {[
                '✅ Plan activated successfully',
                '✅ Premium features unlocked',
                '✅ Confirmation email sent',
              ].map(text => (
                <div key={text} style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>
                  {text}
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 20 }}>
              Redirecting to dashboard…
            </p>
          </motion.div>
        )}

        {/* ── Step: Failed ── */}
        {step === 'failed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ padding: '60px 40px', textAlign: 'center' }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: 'rgba(248,113,113,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertCircle size={40} color="#f87171" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Payment Failed</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28, maxWidth: 340, margin: '0 auto 28px' }}>
              Your payment could not be processed. No amount has been deducted. Please try again or use a different payment method.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => { setStep('select'); setError(''); }} className="btn-primary" style={{ padding: '12px 28px' }}>
                <ArrowLeft size={15} /> Try Again
              </button>
              <button onClick={onClose} className="btn-outline" style={{ padding: '12px 28px' }}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// Processing stage with delayed check animation
function ProcessingStage({ text, delay, color }: { text: string; delay: number; color: string }) {
  const [done, setDone] = useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setDone(true), delay + 1200);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay / 1000 }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
    >
      {done ? (
        <CheckCircle2 size={16} color="#34d399" />
      ) : (
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          border: `2px solid ${color}`, borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
      )}
      <span style={{ color: done ? 'var(--green)' : 'var(--text2)' }}>{text}</span>
    </motion.div>
  );
}


// ═══════════════════════════════════════════════
// MAIN PREMIUM PAGE
// ═══════════════════════════════════════════════
export default function PremiumPage() {
  const { data, setData } = useFinance();
  const currentPlan = data.currentPlan || 'Basic';
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<typeof PLANS[0] | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpgrade = (planId: string) => {
    if (planId === currentPlan.toLowerCase()) return;
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return;

    if (planId === 'basic') {
      // Downgrade — no payment needed
      setData({ currentPlan: 'Basic' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      return;
    }

    // Open checkout modal for paid plans
    setCheckoutPlan(plan);
  };

  const handlePaymentSuccess = () => {
    if (checkoutPlan) {
      setData({ currentPlan: checkoutPlan.name });
    }
    setCheckoutPlan(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const an = (i: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  });

  const yearlyDiscount = 17;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 48, paddingBottom: 60, maxWidth: 1100, margin: '0 auto' }}>

      {/* ═══ Checkout Modal ═══ */}
      <AnimatePresence>
        {checkoutPlan && (
          <CheckoutModal
            plan={checkoutPlan}
            billing={billing}
            onClose={() => setCheckoutPlan(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>

      {/* ═══ Hero Section ═══ */}
      <motion.div {...an(0)} style={{ textAlign: 'center', paddingTop: 12 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
          borderRadius: 999, background: 'rgba(129,140,248,0.1)', color: 'var(--purple)',
          fontSize: 12, fontWeight: 600, marginBottom: 20, letterSpacing: 0.5,
        }}>
          <Sparkles size={14} /> PREMIUM PLANS
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
          Take Control of Your <br />
          <span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Financial Future
          </span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
          Unlock AI-powered insights, smart recurring alerts, budget health scoring,
          and tools that help you save more every month.
        </p>
      </motion.div>

      {/* ═══ Billing Toggle ═══ */}
      <motion.div {...an(1)} style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: 4, borderRadius: 999,
          background: 'var(--bg2)', border: '1.5px solid var(--border)',
        }}>
          <button
            onClick={() => setBilling('monthly')}
            style={{
              padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              background: billing === 'monthly' ? 'var(--surface)' : 'transparent',
              color: billing === 'monthly' ? 'var(--text)' : 'var(--text3)',
              boxShadow: billing === 'monthly' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            style={{
              padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              background: billing === 'yearly' ? 'var(--surface)' : 'transparent',
              color: billing === 'yearly' ? 'var(--text)' : 'var(--text3)',
              boxShadow: billing === 'yearly' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            Yearly
            <span style={{
              background: 'rgba(52,211,153,0.15)', color: '#34d399',
              padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
            }}>
              -{yearlyDiscount}%
            </span>
          </button>
        </div>
      </motion.div>

      {/* ═══ Plan Cards ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {PLANS.map((plan, i) => {
          const isCurrentPlan = currentPlan.toLowerCase() === plan.id;
          const PlanIcon = plan.icon;
          const price = billing === 'yearly' && plan.price > 0
            ? Math.round(plan.priceYearly / 12)
            : plan.price;
          const totalPrice = billing === 'yearly' ? plan.priceYearly : plan.price;

          return (
            <motion.div
              key={plan.id}
              className={`panel ${plan.popular ? 'gradient-border' : ''}`}
              style={{
                padding: 0, display: 'flex', flexDirection: 'column',
                position: 'relative', overflow: 'visible',
                transform: plan.popular ? 'scale(1.03)' : 'none',
                zIndex: plan.popular ? 2 : 1,
              }}
              {...an(i + 2)}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--grad)', padding: '5px 18px', borderRadius: 999,
                  fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 0.8,
                  boxShadow: '0 4px 16px rgba(129,140,248,0.3)',
                  whiteSpace: 'nowrap',
                }}>
                  ⚡ MOST POPULAR
                </div>
              )}

              <div style={{ padding: '32px 28px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${plan.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PlanIcon size={24} color={plan.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: 10 }}>
                        Current Plan
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.5 }}>
                      {price === 0 ? 'Free' : `₹${price}`}
                    </span>
                    {price > 0 && <span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 500 }}>/mo</span>}
                  </div>
                  {billing === 'yearly' && plan.price > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'line-through' }}>
                        {fmt(plan.price * 12)}/yr
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>
                        {fmt(totalPrice)}/yr
                      </span>
                      <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: 9 }}>
                        Save {fmt(plan.price * 12 - totalPrice)}
                      </span>
                    </div>
                  )}
                  {billing === 'monthly' && plan.price > 0 && (
                    <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Billed monthly · Cancel anytime</p>
                  )}
                </div>

                <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>{plan.desc}</p>
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '0 28px' }} />

              <div style={{ padding: '20px 28px', flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map(f => (
                    <li key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13 }}>
                      {f.included ? (
                        <Check size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
                      ) : (
                        <X size={16} color="var(--text3)" style={{ flexShrink: 0, marginTop: 1, opacity: 0.4 }} />
                      )}
                      <span style={{ color: f.included ? 'var(--text)' : 'var(--text3)', fontWeight: f.included ? 500 : 400 }}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: '0 28px 28px' }}>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan}
                  className={plan.popular ? 'btn-primary' : 'btn-outline'}
                  style={{
                    width: '100%', padding: '12px 0', fontSize: 14,
                    opacity: isCurrentPlan ? 0.5 : 1,
                    cursor: isCurrentPlan ? 'default' : 'pointer',
                  }}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.id === 'basic' ? 'Downgrade to Basic' : (
                    <>Upgrade to {plan.name} <ArrowRight size={15} /></>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ Success Toast ═══ */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg2)', border: '1px solid var(--green)',
              borderRadius: 16, padding: '16px 28px', boxShadow: 'var(--shadow-lg)',
              display: 'flex', alignItems: 'center', gap: 12, zIndex: 300,
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={20} color="#34d399" />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>Plan updated successfully! 🎉</p>
              <p style={{ fontSize: 12, color: 'var(--text2)' }}>You're now on the {currentPlan} plan.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Feature Highlights ═══ */}
      <motion.div {...an(5)}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Why Upgrade to Pro?</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Features that pay for themselves within the first month.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { icon: Cpu, title: 'AI Smart Insights', desc: 'Get personalized financial advice based on your spending patterns', color: '#818cf8' },
            { icon: Bell, title: 'Recurring Alerts', desc: 'Never miss a subscription charge — detect and manage automatically', color: '#f472b6' },
            { icon: Shield, title: 'Budget Health Score', desc: 'A 0-100 score that tracks your financial wellness in real-time', color: '#34d399' },
            { icon: Download, title: 'Rich Exports', desc: 'Export detailed reports in CSV, PDF, and Excel formats', color: '#f0b429' },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div key={feat.title} className="data-card" style={{ textAlign: 'center', padding: 28 }} {...an(i + 6)}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, margin: '0 auto 16px',
                  background: `${feat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={24} color={feat.color} />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{feat.title}</h4>
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ Comparison Table ═══ */}
      <motion.div {...an(10)}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Feature Comparison</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>See exactly what you get with each plan.</p>
        </div>
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="summary-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Feature</th>
                <th style={{ textAlign: 'center' }}>Basic</th>
                <th style={{ textAlign: 'center', color: 'var(--purple)' }}>Pro ⚡</th>
                <th style={{ textAlign: 'center' }}>Wealth</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'PDF Statement Uploads', basic: '3/month', pro: 'Unlimited', wealth: 'Unlimited' },
                { feature: 'Auto Categorization', basic: '✅', pro: '✅', wealth: '✅' },
                { feature: 'Dashboard Analytics', basic: 'Basic', pro: 'Advanced', wealth: 'Advanced+' },
                { feature: 'AI-Powered Insights', basic: '—', pro: '✅', wealth: '✅' },
                { feature: 'Recurring Payment Alerts', basic: '—', pro: '✅', wealth: '✅' },
                { feature: 'Budget Health Score', basic: '—', pro: '✅', wealth: '✅' },
                { feature: 'Custom Categories', basic: '—', pro: '✅', wealth: '✅' },
                { feature: 'Export Formats', basic: 'CSV', pro: 'CSV, PDF, Excel', wealth: 'All + API' },
                { feature: 'Financial Goals', basic: '3 goals', pro: 'Unlimited', wealth: 'Unlimited' },
                { feature: 'Investment Tracking', basic: '—', pro: '—', wealth: '✅' },
                { feature: 'Crypto Integration', basic: '—', pro: '—', wealth: '✅' },
                { feature: 'Net Worth Dashboard', basic: '—', pro: '—', wealth: '✅' },
                { feature: 'Family Shared Accounts', basic: '—', pro: '—', wealth: 'Up to 5' },
                { feature: 'Personal Advisor', basic: '—', pro: '—', wealth: '1 session/mo' },
                { feature: 'Support', basic: 'Community', pro: 'Priority Email', wealth: 'Dedicated Manager' },
              ].map(row => (
                <tr key={row.feature}>
                  <td style={{ fontWeight: 500 }}>{row.feature}</td>
                  <td style={{ textAlign: 'center', color: row.basic === '—' ? 'var(--text3)' : 'var(--text2)' }}>{row.basic}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500, color: row.pro === '—' ? 'var(--text3)' : 'var(--purple)' }}>{row.pro}</td>
                  <td style={{ textAlign: 'center', color: row.wealth === '—' ? 'var(--text3)' : 'var(--text2)' }}>{row.wealth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ═══ Testimonials ═══ */}
      <motion.div {...an(11)}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Loved by Users</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>See what Pro users are saying.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} className="panel" style={{ padding: 28 }} {...an(i + 12)}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#f0b429" color="#f0b429" />)}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
                "{t.text}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {t.avatar}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)' }}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Trust Badges ═══ */}
      <motion.div {...an(15)} style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
        {[
          { icon: Shield, text: 'Bank-grade encryption', sub: 'AES-256 + TLS 1.3' },
          { icon: Lock, text: 'Local PDF processing', sub: 'Data never leaves your browser' },
          { icon: CreditCard, text: 'Secure payments', sub: 'Razorpay certified' },
          { icon: Users, text: '10,000+ users', sub: 'Trusted across India' },
        ].map(badge => {
          const Icon = badge.icon;
          return (
            <div key={badge.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon size={18} color="var(--text3)" />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{badge.text}</p>
                <p style={{ fontSize: 10, color: 'var(--text3)' }}>{badge.sub}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ═══ FAQ Section ═══ */}
      <motion.div {...an(16)}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Everything you need to know about our plans.</p>
        </div>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="panel"
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{faq.q}</span>
                <ChevronDown
                  size={18} color="var(--text3)"
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: expandedFaq === i ? 'rotate(180deg)' : 'rotate(0)',
                    flexShrink: 0,
                  }}
                />
              </div>
              <AnimatePresence>
                {expandedFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      padding: '0 20px 16px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.7,
                      borderTop: '1px solid var(--border)', paddingTop: 14,
                    }}>
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Final CTA ═══ */}
      <motion.div
        {...an(17)}
        style={{
          textAlign: 'center', padding: '48px 32px', borderRadius: 'var(--radius-lg)',
          background: 'var(--grad-subtle)', border: '1px solid var(--border)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(129,140,248,0.08)', filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60, width: 180, height: 180,
          borderRadius: '50%', background: 'rgba(244,114,182,0.06)', filter: 'blur(60px)',
        }} />
        <div style={{ position: 'relative' }}>
          <Sparkles size={32} color="var(--purple)" style={{ marginBottom: 16, opacity: 0.8 }} />
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Ready to Take Control?</h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Join thousands of users who are saving more, spending smarter, and building real financial wellness with FinSight Pro.
          </p>
          <button
            onClick={() => handleUpgrade('pro')}
            className="btn-primary"
            style={{ padding: '14px 36px', fontSize: 15 }}
            disabled={currentPlan.toLowerCase() === 'pro'}
          >
            {currentPlan.toLowerCase() === 'pro' ? (
              '✅ You\'re on Pro'
            ) : (
              <><Zap size={18} /> Get Pro — {billing === 'yearly' ? `₹${Math.round(3490 / 12)}/mo` : '₹349/mo'}</>
            )}
          </button>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12 }}>
            14-day money-back guarantee · No credit card required for Basic
          </p>
        </div>
      </motion.div>
    </div>
  );
}
