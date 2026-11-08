import React, { useState } from 'react';
import { Mail, MessageCircle, FileText, Scale, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', message: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `FS-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketId(id);
    setSubmitted(true);
  };

  const contacts = [
    { icon: Mail, title: 'Email Us', desc: 'support@finsight.com', clr: '#58a6ff', bg: 'rgba(88,166,255,0.1)', href: 'mailto:support@finsight.com' },
    { icon: Phone, title: 'Phone Support', desc: '+1 (415) 890-5412', clr: '#38bdf8', bg: 'rgba(56,189,248,0.1)', href: 'tel:+14158905412' },
    { icon: MessageCircle, title: 'Live Chat', desc: 'Available 9AM – 5PM IST', clr: '#34d399', bg: 'rgba(52,211,153,0.1)', link: '/dashboard' },
    { icon: Scale, title: 'Legal & DMCA', desc: 'Terms, Privacy & Agent Notice', clr: '#818cf8', bg: 'rgba(129,140,248,0.1)', link: '/legal' },
  ];

  return (
    <div className="page-enter" style={{ paddingBottom: 60 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Support Center</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>We are here to assist with statement parsing, account security, and billing inquiries.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
        {/* Contact Methods */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {contacts.map((c, i) => {
            const Icon = c.icon;
            const cardContent = (
              <motion.div
                key={c.title}
                className="panel panel-glow"
                style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '18px 20px', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
              >
                <div style={{ padding: 12, borderRadius: 12, background: c.bg, color: c.clr, flexShrink: 0 }}>
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{c.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', textDecoration: c.href ? 'underline' : 'none' }}>{c.desc}</div>
                </div>
              </motion.div>
            );

            if (c.href) {
              return (
                <a key={c.title} href={c.href} style={{ textDecoration: 'none' }}>
                  {cardContent}
                </a>
              );
            }
            if (c.link) {
              return (
                <Link key={c.title} to={c.link} style={{ textDecoration: 'none' }}>
                  {cardContent}
                </Link>
              );
            }
            return cardContent;
          })}
        </div>

        {/* Message Form / Success Banner */}
        <motion.div className="panel" style={{ padding: 32 }} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '30px 10px' }}
              >
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52, 211, 153, 0.12)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ticket Created Successfully</h3>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 18px' }}>
                  Your support request has been logged under priority ticket <strong style={{ color: 'var(--purple)' }}>#{ticketId}</strong>. A FinSight financial security engineer will reply to <strong>{formData.email || 'your email'}</strong> within 2 hours.
                </p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setFormData({ firstName: '', lastName: '', email: '', message: '' }); }}
                  className="btn-outline"
                  style={{ fontSize: 13, padding: '10px 20px', cursor: 'pointer' }}
                >
                  Submit Another Message
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Send us a message</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      placeholder="Jane"
                      required
                      className="input"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      required
                      className="input"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="input"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label className="label">Message</label>
                  <textarea
                    placeholder="Describe your inquiry or transaction question..."
                    required
                    className="input"
                    style={{ height: 120, resize: 'vertical' }}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', cursor: 'pointer' }}>
                  <Mail size={16} /> Send Priority Message
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
