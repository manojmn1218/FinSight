import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, LogOut, LayoutDashboard, Users, CreditCard, Settings, Sun, Moon, Timer } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'User Management' },
  { path: '/admin/revenue', icon: CreditCard, label: 'Revenue Analytics' },
  { path: '/admin/settings', icon: Settings, label: 'Platform Settings' },
];

export default function AdminLayout() {
  const { logoutUser, sessionTimeLeft } = useFinance();
  const nav = useNavigate();
  const loc = useLocation();
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 280,
        padding: '24px 16px',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', marginBottom: 8 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <ShieldAlert size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 0.3 }}>Executive</div>
            <div style={{
              fontSize: 10, fontWeight: 700,
              background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase', letterSpacing: 1.5,
            }}>
              Central Control
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 14px 12px' }} />

        {/* Nav */}
        <div className="section-label">Navigation</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(n => {
            const active = loc.pathname === n.path;
            return (
              <NavLink
                key={n.path}
                to={n.path}
                className={`nav-item${active ? ' active' : ''}`}
              >
                <n.icon size={18} />
                {n.label}
              </NavLink>
            );
          })}
        </nav>

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
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 48px', overflowY: 'auto', maxHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
