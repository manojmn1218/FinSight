import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Lightbulb, Crown, HelpCircle, LogOut, Sun, Moon, User, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';

const MAIN_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
];

const ACCOUNT_NAV = [
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/premium', label: 'Premium', icon: Crown },
  { path: '/support', label: 'Support', icon: HelpCircle },
];

export default function DashboardLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const { data, logoutUser, sessionTimeLeft } = useFinance();
  const [isDark, setIsDark] = useState(!document.body.classList.contains('light'));

  const logout = () => { logoutUser(); nav('/login'); };

  const sessionHours = Math.floor(sessionTimeLeft / 3600000);
  const sessionMins = Math.floor((sessionTimeLeft % 3600000) / 60000);
  const sessionSecs = Math.floor((sessionTimeLeft % 60000) / 1000);
  const sessionLow = sessionHours === 0 && sessionMins < 5;

  const toggleTheme = () => {
    const isLight = document.body.classList.toggle('light');
    setIsDark(!isLight);
  };

  const initials = (data.userName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const renderNav = (items: typeof MAIN_NAV) => items.map(lnk => {
    const active = loc.pathname.startsWith(lnk.path);
    const Icon = lnk.icon;
    return (
      <Link
        key={lnk.path}
        to={lnk.path}
        className={`nav-item${active ? ' active' : ''}`}
      >
        <Icon size={18} />
        <span>{lnk.label}</span>
      </Link>
    );
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260,
        padding: '24px 16px',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* Brand + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: 0.5,
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.userName || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.userEmail || 'user@finsight.ai'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '4px 14px 12px' }} />

        {/* Main nav */}
        <div className="section-label">Main</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderNav(MAIN_NAV)}
        </nav>

        {/* Account nav */}
        <div className="section-label" style={{ marginTop: 20 }}>Account</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderNav(ACCOUNT_NAV)}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Session timer pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', margin: '0 4px',
          borderRadius: 999,
          background: sessionLow ? 'rgba(248,113,113,0.08)' : 'var(--surface)',
          border: `1px solid ${sessionLow ? 'rgba(248,113,113,0.15)' : 'var(--border)'}`,
          fontSize: 11, fontWeight: 600,
          color: sessionLow ? 'var(--red)' : 'var(--text3)',
        }}>
          <Timer size={12} />
          <span>
            {sessionHours > 0 ? `${sessionHours}h ` : ''}{sessionMins}:{sessionSecs.toString().padStart(2, '0')}
          </span>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: sessionLow ? 'var(--red)' : 'var(--green)',
            animation: sessionLow ? 'pulse 1s infinite' : 'none',
            marginLeft: 'auto',
          }} />
        </div>

        {/* Bottom actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
          <button onClick={toggleTheme} className="btn-ghost">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={logout} className="btn-ghost danger">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px 40px', background: 'var(--bg)', overflowY: 'auto', maxHeight: '100vh' }}>
        <motion.div
          key={loc.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
