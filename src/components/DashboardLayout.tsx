import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Lightbulb, Crown, HelpCircle, LogOut, Sun, Moon, Activity, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/premium', label: 'Premium', icon: Crown },
  { path: '/support', label: 'Support', icon: HelpCircle },
];

export default function DashboardLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const { reset } = useFinance();
  const [isDark, setIsDark] = useState(!document.body.classList.contains('light'));

  const logout = () => { nav('/login'); };

  const toggleTheme = () => {
    const isLight = document.body.classList.toggle('light');
    setIsDark(!isLight);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 250, padding: '28px 20px', background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <img src="/ft.jpeg" alt="Logo" className="app-logo" style={{ width: 38, height: 38 }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>FinSight</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>AI Finance</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {NAV.map(lnk => {
            const active = loc.pathname.startsWith(lnk.path);
            const Icon = lnk.icon;
            return (
              <Link key={lnk.path} to={lnk.path} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: active ? 'rgba(167,139,250,0.1)' : 'transparent', color: active ? '#a78bfa' : 'var(--text2)', textDecoration: 'none', transition: 'background 0.2s, color 0.2s', fontWeight: active ? 600 : 400, fontSize: 14 }}>
                <Icon size={19} /><span>{lnk.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', borderRadius: 12, transition: 'color 0.2s, background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {isDark ? <Sun size={19} /> : <Moon size={19} />}<span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', borderRadius: 12, transition: 'color 0.2s, background 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'transparent'; }}>
            <LogOut size={19} /><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '36px 40px', background: 'var(--bg)', overflowY: 'auto' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
