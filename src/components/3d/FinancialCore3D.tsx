import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface FinancialCore3DProps {
  healthScore?: number;
  savingsRate?: number;
  interactive?: boolean;
}

export default function FinancialCore3D({
  healthScore = 75,
  savingsRate = 25,
  interactive = true,
}: FinancialCore3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 240;

    // 1. Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.2;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      // Fallback for environments where WebGL is disabled
      return;
    }

    // Determine primary color based on health score
    const coreColor = healthScore >= 75 ? 0x34d399 : healthScore >= 50 ? 0x818cf8 : 0xf87171;
    const accentColor = 0xc084fc;

    // 2. Geometric Group
    const group = new THREE.Group();
    scene.add(group);

    // Core Wireframe Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: coreColor,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
      emissive: coreColor,
      emissiveIntensity: 0.25,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Inner glowing solid core
    const innerGeo = new THREE.OctahedronGeometry(0.65, 0);
    const innerMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.1,
      metalness: 0.9,
      emissive: accentColor,
      emissiveIntensity: 0.4,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    // Orbital Particle Ring (representing transactions / wealth flow)
    const particleCount = 64;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.75 + (Math.random() - 0.5) * 0.35;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      particleScales[i] = Math.random() * 2 + 1;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('scale', new THREE.BufferAttribute(particleScales, 1));

    const particleMat = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.05,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    group.add(particleSystem);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(coreColor, 3, 20);
    pointLight1.position.set(3, 4, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(accentColor, 2, 20);
    pointLight2.position.set(-3, -3, 2);
    scene.add(pointLight2);

    // 4. Mouse interaction variables
    let targetRotX = 0;
    let targetRotY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = mouseX * 0.8;
      targetRotX = mouseY * 0.6;
    };

    if (interactive) {
      container.addEventListener('mousemove', onMouseMove);
    }

    // 5. Animation loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Continuous ambient rotation
      coreMesh.rotation.y += delta * 0.25;
      coreMesh.rotation.x += delta * 0.12;

      innerMesh.rotation.y -= delta * 0.5;
      innerMesh.rotation.z += delta * 0.3;

      particleSystem.rotation.y += delta * 0.4;
      particleSystem.rotation.x = Math.sin(time * 0.5) * 0.2;

      // Gentle breathing pulse
      const pulse = 1 + Math.sin(time * 2.2) * 0.04;
      innerMesh.scale.set(pulse, pulse, pulse);

      // Smooth mouse interpolation (lerp)
      group.rotation.y += (targetRotY - group.rotation.y) * 0.06;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      if (interactive) {
        container.removeEventListener('mousemove', onMouseMove);
      }
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [healthScore, savingsRate, interactive]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 210,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
        }}
      />
      {/* Subtle indicator pill overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 14,
          padding: '4px 10px',
          borderRadius: 999,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text2)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          pointerEvents: 'none',
          opacity: isHovered ? 1 : 0.65,
          transition: 'opacity 0.2s ease',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: healthScore >= 75 ? '#34d399' : '#818cf8',
            boxShadow: `0 0 8px ${healthScore >= 75 ? '#34d399' : '#818cf8'}`,
          }}
        />
        <span>3D Pulse Engine</span>
      </div>
    </div>
  );
}

