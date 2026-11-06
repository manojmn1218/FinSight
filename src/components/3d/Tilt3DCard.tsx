import React, { useState, useRef, useCallback } from 'react';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxTilt?: number;
  glareOpacity?: number;
  glowColor?: string;
}

export default function Tilt3DCard({
  children,
  className = '',
  style = {},
  maxTilt = 8,
  glareOpacity = 0.15,
  glowColor = 'rgba(129, 140, 248, 0.25)',
}: Tilt3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * maxTilt;
    const rotY = ((x - centerX) / centerX) * maxTilt;

    setTransform(`perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: glareOpacity,
    });
  }, [maxTilt, glareOpacity]);

  const handleMouseLeave = useCallback(() => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlare(prev => ({ ...prev, opacity: 0 }));
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        ...style,
        transform,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1), box-shadow 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: glare.opacity > 0
          ? `0 18px 40px -10px rgba(0, 0, 0, 0.5), 0 0 25px -5px ${glowColor}`
          : 'var(--shadow)',
      }}
    >
      {/* Dynamic Cursor Glare */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle 200px at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.2) 0%, transparent 80%)`,
          opacity: glare.opacity,
          transition: 'opacity 0.25s ease',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, transform: 'translateZ(12px)' }}>
        {children}
      </div>
    </div>
  );
}
