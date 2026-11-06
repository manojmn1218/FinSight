import React from 'react';

interface HealthGauge3DProps {
  score: number;
  label: string;
  size?: number;
}

export default function HealthGauge3D({ score, label, size = 150 }: HealthGauge3DProps) {
  const r = (size - 28) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#f0b429' : '#f87171';
  const glow = score >= 75 ? 'rgba(52, 211, 153, 0.4)' : score >= 50 ? 'rgba(240, 180, 41, 0.4)' : 'rgba(248, 113, 113, 0.4)';

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.06) 0%, rgba(13, 17, 23, 0.8) 70%)',
        boxShadow: `inset 0 2px 4px rgba(255, 255, 255, 0.1), inset 0 -4px 8px rgba(0, 0, 0, 0.6), 0 12px 24px -6px rgba(0, 0, 0, 0.5), 0 0 24px -4px ${glow}`,
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <svg
        width={size}
        height={size}
        style={{
          transform: 'rotate(-90deg)',
          filter: `drop-shadow(0 0 6px ${glow})`,
        }}
      >
        {/* Outer subtle guide track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="10"
        />
        {/* Main 3D progress ring with gradient cap */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
          }}
        />
      </svg>

      {/* Center 3D embossed pedestal */}
      <div
        style={{
          position: 'absolute',
          width: size - 44,
          height: size - 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(23, 29, 44, 0.9) 0%, rgba(10, 14, 22, 0.95) 100%)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 800,
            color,
            letterSpacing: -1,
            lineHeight: 1,
            textShadow: `0 0 16px ${glow}`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text3)',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginTop: 4,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

