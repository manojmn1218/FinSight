import React, { useState } from 'react';
import { Settings, Shield, Globe, Key, AlertTriangle, Save } from 'lucide-react';

const panel: React.CSSProperties = {
  background: 'var(--surface)',
  backdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

export default function AdminSettingsPage() {
  const [maintMode, setMaintMode] = useState(false);
  const [allowSignups, setAllowSignups] = useState(true);
  const [apiKey, setApiKey] = useState('sk_live_fS8k2jL9...');

  return (
    <div className="page-enter" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>Platform Settings</h1>
          <p style={{ margin: 0, color: 'var(--text2)', fontSize: 14 }}>Configure global platform behavior and security.</p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="panel" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <Globe size={20} color="var(--purple)" /> Global Settings
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Maintenance Mode</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Displays a maintenance page to all non-admin users.</div>
            </div>
            <button onClick={() => setMaintMode(!maintMode)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: maintMode ? 'var(--purple)' : 'var(--bg3)', cursor: 'pointer', position: 'relative', transition: 'var(--transition)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: maintMode ? 22 : 2, transition: 'var(--transition)' }} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Allow New Signups</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Enable or disable the public registration form.</div>
            </div>
            <button onClick={() => setAllowSignups(!allowSignups)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: allowSignups ? 'var(--green)' : 'var(--bg3)', cursor: 'pointer', position: 'relative', transition: 'var(--transition)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: allowSignups ? 22 : 2, transition: 'var(--transition)' }} />
            </button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <Shield size={20} color="var(--purple)" /> Security & API
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Master API Key</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                type="text" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                className="input"
                style={{ flex: 1 }} 
              />
              <button className="btn-outline" style={{ padding: '0 20px', fontSize: 14 }}>Rotate Key</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>This key provides full access to the platform API. Keep it secure.</p>
          </div>

          <div style={{ padding: 20, borderRadius: 12, background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', gap: 16 }}>
            <AlertTriangle color="var(--red)" size={24} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--red)', marginBottom: 4 }}>Danger Zone</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5 }}>Actions here can cause irreversible damage to the platform data.</p>
              <button style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Purge Inactive Users</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
