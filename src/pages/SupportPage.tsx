import React from 'react';
import { Mail, MessageCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const panel: React.CSSProperties = { padding: 24, background: 'var(--surface)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.25)' };
const inp: React.CSSProperties = { width: '100%', padding: '13px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit' };

export default function SupportPage() {
  const submit = (e: React.FormEvent) => { e.preventDefault(); alert('Message sent! We\'ll get back to you shortly.'); };

  const contacts = [
    { icon: Mail, title: 'Email Us', desc: 'support@finsight.ai', clr: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    { icon: MessageCircle, title: 'Live Chat', desc: 'Available 9AM – 5PM IST', clr: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    { icon: FileText, title: 'Documentation', desc: 'Read our detailed guides', clr: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Support Center</h1>
        <p style={{ color: 'var(--text2)' }}>How can we help you today?</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {contacts.map(c => {
            const Icon = c.icon;
            return (
              <div key={c.title} style={{ ...panel, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ padding: 12, borderRadius: 12, background: c.bg, color: c.clr, flexShrink: 0 }}><Icon size={22} /></div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{c.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>{c.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <motion.div style={panel} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Send us a message</h3>
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>First Name</label>
                <input type="text" placeholder="John" required style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Last Name</label>
                <input type="text" placeholder="Doe" required style={inp} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Email</label>
              <input type="email" placeholder="you@example.com" required style={inp} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Message</label>
              <textarea placeholder="How can we help?" required style={{ ...inp, height: 120, resize: 'vertical', borderRadius: 12 }} />
            </div>
            <button type="submit" style={{ padding: '12px 28px', borderRadius: 999, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Send Message</button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
