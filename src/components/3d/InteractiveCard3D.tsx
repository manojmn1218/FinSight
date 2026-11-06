import React, { useState, useRef, useCallback } from 'react';
import { Wifi, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

interface InteractiveCard3DProps {
  balance: number;
  userName: string;
  isStatementBalance?: boolean;
  currency?: string;
  bankName?: string;
}

export default function InteractiveCard3D({
  balance,
  userName,
  isStatementBalance = false,
  currency = '₹',
  bankName = 'FinSight Obsidian',
}: InteractiveCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isFlipped, setIsFlipped] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 14;
    const rotY = ((x - centerX) / centerX) * 16;

    setRotateX(rotX);
    setRotateY(rotY);

    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.85,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setGlare(prev => ({ ...prev, opacity: 0 }));
  }, []);

  const formattedBalance = `${currency}${Math.abs(balance).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const displayName = (userName || 'FINSIGHT MEMBER').toUpperCase();

  return (
    <div
      style={{
        perspective: '1200px',
        width: '100%',
        maxWidth: 380,
        height: 226,
        userSelect: 'none',
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsFlipped(f => !f)}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          borderRadius: 20,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY + (isFlipped ? 180 : 0)}deg)`,
          transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.4, 1), box-shadow 0.25s ease',
          cursor: 'pointer',
          boxShadow: glare.opacity > 0
            ? '0 28px 60px -15px rgba(0, 0, 0, 0.75), 0 0 35px -5px rgba(129, 140, 248, 0.35)'
            : '0 20px 45px -15px rgba(0, 0, 0, 0.6), 0 0 20px -5px rgba(0, 0, 0, 0.4)',
        }}
        title="Click to flip card"
      >
        {/* ═══ FRONT FACE ═══ */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 20,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #111422 0%, #0a0c14 45%, #181428 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* Dynamic Glare & Specular Reflection */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle 240px at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.22) 0%, rgba(192, 132, 252, 0.12) 40%, transparent 80%)`,
              opacity: glare.opacity,
              transition: 'opacity 0.25s ease',
              pointerEvents: 'none',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Holographic foil wave overlay */}
          <div
            style={{
              position: 'absolute',
              inset: -50,
              background: 'repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255, 255, 255, 0.02) 18px, rgba(255, 255, 255, 0.02) 36px)',
              pointerEvents: 'none',
            }}
          />

          {/* Top Row: Bank name & Contactless wave */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transform: 'translateZ(30px)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(129, 140, 248, 0.5)',
                }}
              >
                <Sparkles size={14} color="#fff" />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  color: '#fff',
                  textTransform: 'uppercase',
                }}
              >
                {bankName}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.7)' }}>
              <Wifi size={18} style={{ transform: 'rotate(90deg)' }} />
              {isStatementBalance && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'rgba(52, 211, 153, 0.18)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    textTransform: 'uppercase',
                  }}
                >
                  Verified Balance
                </span>
              )}
            </div>
          </div>

          {/* Middle: Gold EMV Chip & Balance */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              transform: 'translateZ(40px)',
              position: 'relative',
              zIndex: 2,
              margin: '8px 0',
            }}
          >
            {/* 3D Realistic Gold Chip */}
            <div
              style={{
                width: 44,
                height: 34,
                borderRadius: 7,
                background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)',
                boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
                position: 'relative',
                border: '1px solid rgba(161, 98, 7, 0.4)',
                overflow: 'hidden',
              }}
            >
              {/* Chip internal circuit lines */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '1px solid rgba(113, 63, 18, 0.35)',
                  borderRadius: 5,
                  margin: 4,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 1,
                  background: 'rgba(113, 63, 18, 0.4)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '42%',
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'rgba(113, 63, 18, 0.4)',
                }}
              />
            </div>

            {/* Live Balance Amount */}
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.6)',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 2,
                }}
              >
                Liquid Balance
              </span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: balance >= 0 ? '#34d399' : '#f87171',
                  letterSpacing: -0.5,
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: balance >= 0
                    ? '0 0 16px rgba(52, 211, 153, 0.4)'
                    : '0 0 16px rgba(248, 113, 113, 0.4)',
                }}
              >
                {formattedBalance}
              </span>
            </div>
          </div>

          {/* Bottom: Embossed Card Numbers & Cardholder Name */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              transform: 'translateZ(35px)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: 2.2,
                  color: 'rgba(255, 255, 255, 0.85)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                  marginBottom: 6,
                }}
              >
                •••• •••• •••• 8842
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  color: '#fff',
                  textTransform: 'uppercase',
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </div>
            </div>

            {/* Holographic Logo / Brand badge */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#ef4444',
                    opacity: 0.9,
                    marginRight: -8,
                  }}
                />
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#f59e0b',
                    opacity: 0.9,
                  }}
                />
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: 'rgba(255,255,255,0.5)' }}>
                PREMIUM
              </span>
            </div>
          </div>
        </div>

        {/* ═══ BACK FACE (Revealed on 3D flip) ═══ */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 20,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #0e111d 0%, #07090f 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 0 16px',
            overflow: 'hidden',
          }}
        >
          {/* Black Magnetic Stripe */}
          <div
            style={{
              width: '100%',
              height: 38,
              background: '#020408',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
            }}
          />

          {/* Signature and CVV strip */}
          <div style={{ padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  height: 28,
                  background: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 10,
                  fontSize: 10,
                  fontFamily: 'cursive',
                  color: '#1e293b',
                  letterSpacing: 1,
                }}
              >
                {displayName.toLowerCase()}
              </div>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 4,
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: '#0f172a',
                }}
              >
                729
              </div>
            </div>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 1.4 }}>
              Encrypted end-to-end via AES-256. For authorized financial aggregation on FinSight.
            </p>
          </div>

          {/* Bottom brand lock */}
          <div
            style={{
              padding: '0 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#34d399" />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                Setu AA Framework
              </span>
            </div>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={9} /> Click to flip
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

