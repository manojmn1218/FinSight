import React from 'react';
import { Mail, MessageCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SupportPage() {
  const submit = (e: React.FormEvent) => { e.preventDefault(); alert('Message sent! We\'ll get back to you shortly.'); };

  const contacts = [
    { icon: Mail, title: 'Email Us', desc: 'support@finsight.ai', clr: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
    { icon: MessageCircle, title: 'Live Chat', desc: 'Available 9AM – 5PM IST', clr: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { icon: FileText, title: 'Documentation', desc: 'Read our detailed guides', clr: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
  ];

  return (
    <div className="page-enter">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Support Center</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>How can we help you today?</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {contacts.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                className="panel panel-glow"
                style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '20px 24px', cursor: 'pointer' }}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.35 }}
              >
                <div style={{ padding: 12, borderRadius: 12, background: c.bg, color: c.clr, flexShrink: 0 }}>
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>{c.desc}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div className="panel" style={{ padding: 32 }} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Send us a message</h3>
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label className="label">First Name</label>
                <input type="text" placeholder="John" required className="input" />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input type="text" placeholder="Doe" required className="input" />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Email</label>
              <input type="email" placeholder="you@example.com" required className="input" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Message</label>
              <textarea placeholder="How can we help?" required className="input" style={{ height: 120, resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn-primary">
              <Mail size={18} /> Send Message
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
