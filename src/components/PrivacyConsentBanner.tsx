import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, ExternalLink, X } from 'lucide-react';

export default function PrivacyConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('fs_privacy_consent_accepted');
      if (!consent) {
        // Show banner after brief delay
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore storage access restrictions
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('fs_privacy_consent_accepted', 'true');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 40px)',
            maxWidth: 820,
            zIndex: 9999,
            background: 'rgba(14, 18, 28, 0.94)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(129, 140, 248, 0.28)',
            borderRadius: 'var(--radius)',
            padding: '16px 22px',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(129, 140, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            color: 'var(--text)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(129, 140, 248, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ShieldCheck size={20} color="var(--purple)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                Zero Keystroke Recording &amp; CIPA Non-Wiretapping Guarantee
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>
                FinSight never installs third-party session replays (Hotjar/FullStory) or keystroke wiretapping. We use only essential session cookies for authentication.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Link
              to="/legal#privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--purple)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Legal Details <ExternalLink size={12} />
            </Link>
            <button
              onClick={handleAccept}
              className="btn-primary"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Accept &amp; Continue
            </button>
            <button
              onClick={() => setVisible(false)}
              aria-label="Dismiss banner"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text3)',
                cursor: 'pointer',
                display: 'flex',
                padding: 4,
                borderRadius: 4,
              }}
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

