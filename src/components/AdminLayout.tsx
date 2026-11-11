import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, Users, CreditCard, Settings, Timer, Database, ArrowLeft, Menu, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatSessionDuration } from '../utils/format';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/database', icon: Database, label: 'Database Studio' },
  { path: '/admin/users', icon: Users, label: 'User Management' },
  { path: '/admin/revenue', icon: CreditCard, label: 'Revenue Analytics' },
  { path: '/admin/settings', icon: Settings, label: 'Platform Settings' },
];

export default function AdminLayout() {
  const { logoutUser, sessionTimeLeft } = useFinance();
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  void logoutUser;
  void nav;

  const sessionLow = sessionTimeLeft > 0 && sessionTimeLeft < 5 * 60 * 1000;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Inter', sans-serif" }}>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="btn-ghost"
        aria-label={mobileOpen ? 'Close admin navigation' : 'Open admin navigation'}
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 150, padding: 8,
          display: 'none',
          background: 'var(--surface)',
          borderRadius: 8,
          border: '1px solid var(--border)',
        }}
        id="admin-mobile-menu-btn"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar-collapsible${mobileOpen ? ' open' : ''}`} style={{
        width: 250,
        height: '100vh',
        maxHeight: '100vh',
        overflowY: 'hidden',
        overflowX: 'hidden',
        padding: '16px 12px 10px',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flexShrink: 0,
      }}>
        {/* Brand */}
        <Link to="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 10px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <ShieldAlert size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.2 }}>Executive</div>
            <div style={{
              fontSize: 10, fontWeight: 700,
              background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase', letterSpacing: 1.2,
            }}>
              Central Control
            </div>
          </div>
        </Link>

        {/* Back to User Dashboard Link */}
        <Link
          to="/dashboard"
          className="btn-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--purple)',
            background: 'rgba(129, 140, 248, 0.08)',
            border: '1px solid rgba(129, 140, 248, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: 4,
          }}
          onClick={() => setMobileOpen(false)}
        >
          <ArrowLeft size={16} />
          <span>Back to App</span>
        </Link>

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
                onClick={() => setMobileOpen(false)}
              >
                <n.icon size={16} />
                <span>{n.label}</span>
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
            {formatSessionDuration(sessionTimeLeft, true)}
          </span>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: sessionLow ? 'var(--red)' : 'var(--green)',
            animation: sessionLow ? 'pulse 1s infinite' : 'none',
            marginLeft: 'auto',
          }} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content-area" style={{ flex: 1, padding: '32px 48px', overflowY: 'auto', maxHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>

        {/* Admin Footer */}
        <footer style={{
          marginTop: 48,
          paddingTop: 18,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--text3)',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            &copy; {new Date().getFullYear()} FinSight Executive Console • Internal Administration Only
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link to="/legal" style={{ color: 'var(--text3)', textDecoration: 'none' }}>Legal Hub</Link>
            <Link to="/legal#dmca" style={{ color: 'var(--text3)', textDecoration: 'none' }}>DMCA Notice</Link>
            <Link to="/dashboard" style={{ color: 'var(--text3)', textDecoration: 'none' }}>User Dashboard</Link>
          </div>
        </footer>
      </main>

      <style>{`
        @media (max-width: 768px) {
          #admin-mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
