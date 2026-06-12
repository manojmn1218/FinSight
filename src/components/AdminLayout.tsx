import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, LogOut, LayoutDashboard, Users, CreditCard, Settings, Sun, Moon } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'User Management' },
  { path: '/admin/revenue', icon: CreditCard, label: 'Revenue Analytics' },
  { path: '/admin/settings', icon: Settings, label: 'Platform Settings' },
];

export default function AdminLayout() {
  const { data, setData } = useFinance();
  const nav = useNavigate();
  const loc = useLocation();
  const [isDark, setIsDark] = useState(!document.body.classList.contains('light'));

  useEffect(() => {
    if (!data.isAdmin) nav('/login');
  }, [data.isAdmin, nav]);

  const logout = () => {
    setData({ isAdmin: false });
    nav('/login');
  };

  const toggleTheme = () => {
    const isLight = document.body.classList.toggle('light');
    setIsDark(!isLight);
  };

  if (!data.isAdmin) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 280, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{ width: 40, height: 40, background: 'var(--grad)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ShieldAlert size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>Executive</div>
            <div style={{ fontSize: 10, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Central Control</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {NAV_ITEMS.map(n => {
            const active = loc.pathname === n.path;
            return (
              <NavLink
                key={n.path}
                to={n.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, textDecoration: 'none',
                  background: active ? 'rgba(167, 139, 250, 0.1)' : 'transparent',
                  color: active ? 'var(--purple)' : 'var(--text2)',
                  fontWeight: active ? 600 : 500,
                  transition: 'all 0.2s'
                }}
              >
                <n.icon size={20} />
                {n.label}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
          <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--text2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />} {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: 'none', background: 'var(--surface)', color: 'var(--red)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <LogOut size={18} /> Secure Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px 56px', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
