import React from 'react';

interface FinSightLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  showText?: boolean;
  textSize?: number;
  variant?: 'badge' | 'plain';
}

/**
 * FinSight official SVG Brand Logo.
 * Crisp, vector-rendered, fully responsive, and styled to match the
 * Luxury Cream & Black with Burnt Orange Pop theme.
 */
export default function FinSightLogo({
  size = 32,
  className = '',
  style = {},
  showText = false,
  textSize = 17,
  variant = 'badge',
}: FinSightLogoProps) {
  const isBadge = variant === 'badge';

  const svgElement = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        borderRadius: isBadge ? Math.max(6, Math.round(size * 0.24)) : 0,
        ...style,
      }}
      role="img"
      aria-label="FinSight Logo"
    >
      <defs>
        {/* Background Obsidian Depth Gradient */}
        <linearGradient id="fsBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#191c26" />
          <stop offset="100%" stopColor="#090a0f" />
        </linearGradient>

        {/* Burnt Orange Pop Accent Gradient */}
        <linearGradient id="fsOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff7a45" />
          <stop offset="50%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Warm Cream Monogram Gradient */}
        <linearGradient id="fsCreamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f7f3ee" />
        </linearGradient>

        {/* Ambient Burnt Orange Core Radial Glow */}
        <radialGradient id="fsAmbientGlow" cx="65%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
        </radialGradient>

        {/* Specular Glow Filter for Primary Pillar */}
        <filter id="fsGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#ff6b35" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Squircle Badge Background (when badge variant is active) */}
      {isBadge && (
        <>
          <rect
            width="100"
            height="100"
            rx="24"
            fill="url(#fsBgGrad)"
            stroke="rgba(247, 243, 238, 0.12)"
            strokeWidth="1.5"
          />
          <rect width="100" height="100" rx="24" fill="url(#fsAmbientGlow)" />
        </>
      )}

      {/* FinSight Monogram "F" — Vertical Left Stem */}
      <rect x="20" y="20" width="13" height="60" rx="3.5" fill="url(#fsCreamGrad)" />

      {/* Top Arm with Forward Modern Sweep */}
      <path
        d="M20 20 h50 c3.5 0 6 2.5 6 6 v1 c0 3.5 -2.5 6 -6 6 h-37 v-13 z"
        fill="url(#fsCreamGrad)"
      />

      {/* Middle Arm with Burnt Orange Accent */}
      <path
        d="M20 42 h28 c3 0 5 2 5 5 v0 c0 3 -2 5 -5 5 h-15 v-10 z"
        fill="url(#fsOrangeGrad)"
      />

      {/* Ascending Financial Analytics Growth Bars */}
      {/* Short Bar */}
      <rect x="42" y="62" width="8" height="18" rx="2.5" fill="url(#fsOrangeGrad)" opacity="0.65" />
      {/* Medium Bar */}
      <rect x="54" y="50" width="8" height="30" rx="2.5" fill="url(#fsOrangeGrad)" opacity="0.85" />
      {/* Tall Bar with Core Glow */}
      <rect
        x="66"
        y="38"
        width="8"
        height="42"
        rx="2.5"
        fill="url(#fsOrangeGrad)"
        filter="url(#fsGlowFilter)"
      />

      {/* Ascending Dynamic Trendline & Target Beacon */}
      <path
        d="M36 72 L48 60 L60 48 L73 34"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="73" cy="34" r="2.75" fill="#ffffff" />
    </svg>
  );

  if (!showText) {
    return svgElement;
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.28) }}>
      {svgElement}
      <span
        style={{
          fontWeight: 800,
          fontSize: textSize,
          letterSpacing: -0.4,
          background: 'var(--grad)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        FinSight
      </span>
    </div>
  );
}
