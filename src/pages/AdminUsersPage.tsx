import React, { useState } from 'react';
import { Search, UserX, UserCheck, Edit2, Eye, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export default function AdminUsersPage() {
  const { data } = useFinance();
  const [search, setSearch] = useState('');
  const [suspended, setSuspended] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const users = [
    { 
      id: '1', 
      name: data.userName || 'Unknown User', 
      email: data.userEmail || (data.userName ? `${data.userName.toLowerCase().replace(' ', '.')}@example.com` : 'user@example.com'), 
      plan: data.currentPlan || 'Basic', 
      status: suspended ? 'Suspended' : 'Active', 
      lastActive: 'Just now' 
    }
  ];

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>User Management</h1>
          <p style={{ margin: 0, color: 'var(--text2)', fontSize: 14 }}>View and manage all registered users on the platform.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 16px', gap: 10, width: 300 }}>
          <Search size={18} color="var(--text3)" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', width: '100%', fontSize: 14 }}
          />
        </div>
      </div>

      <div style={{ background: 'var(--surface)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(167, 139, 250, 0.05)' }}>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>User</th>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Plan</th>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Last Active</th>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: 'var(--text2)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                  <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{u.email}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: 12, background: u.plan !== 'Basic' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255,255,255,0.05)', color: u.plan !== 'Basic' ? 'var(--purple)' : 'var(--text2)', padding: '4px 10px', borderRadius: 99, fontWeight: 600 }}>
                    {u.plan}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: u.status === 'Active' ? 'var(--green)' : 'var(--red)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: u.status === 'Active' ? 'var(--green)' : 'var(--red)' }} />
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text2)', fontSize: 13 }}>{u.lastActive}</td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                    <button onClick={() => setSelectedUser(u)} style={{ background: 'none', border: 'none', color: 'var(--purple)', cursor: 'pointer' }}><Eye size={16} /></button>
                    <button onClick={() => alert('Edit User feature is locked in prototype mode.')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                    <button onClick={() => setSuspended(!suspended)} style={{ background: 'none', border: 'none', color: suspended ? 'var(--green)' : 'var(--red)', cursor: 'pointer' }}>
                      {suspended ? <UserCheck size={16} /> : <UserX size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>No users found matching "{search}"</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Summary Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--surface)', padding: 32, borderRadius: 20, width: 400, border: '1px solid var(--border)', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <button onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700 }}>User Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}><span style={{ color: 'var(--text2)' }}>Name:</span> <span style={{ fontWeight: 600 }}>{selectedUser.name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}><span style={{ color: 'var(--text2)' }}>Email:</span> <span style={{ fontWeight: 600 }}>{selectedUser.email}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}><span style={{ color: 'var(--text2)' }}>Status:</span> <span style={{ fontWeight: 600, color: selectedUser.status === 'Active' ? 'var(--green)' : 'var(--red)' }}>{selectedUser.status}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}><span style={{ color: 'var(--text2)' }}>Plan:</span> <span style={{ fontWeight: 600, color: selectedUser.plan !== 'Basic' ? 'var(--purple)' : 'var(--text)' }}>{selectedUser.plan}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}><span style={{ color: 'var(--text2)' }}>Monthly Income:</span> <span style={{ fontWeight: 600 }}>₹{data.monthlyIncome.toLocaleString('en-IN')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}><span style={{ color: 'var(--text2)' }}>Total Balance:</span> <span style={{ fontWeight: 600 }}>₹{data.totalBalance.toLocaleString('en-IN')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}><span style={{ color: 'var(--text2)' }}>Savings Goal:</span> <span style={{ fontWeight: 600 }}>{data.savingsPercent}%</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text2)' }}>Onboarded:</span> <span style={{ fontWeight: 600, color: data.isOnboarded ? 'var(--green)' : 'var(--text2)' }}>{data.isOnboarded ? 'Completed' : 'Pending'}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
