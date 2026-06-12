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
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Platform Settings</h1>
          <p style={{ margin: 0, color: 'var(--text2)', fontSize: 14 }}>Configure global platform behavior and security.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: 'var(--grad)', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div style={{ ...panel, padding: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <Globe size={20} color="var(--purple)" /> Global Settings
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Maintenance Mode</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Displays a maintenance page to all non-admin users.</div>
            </div>
            <button onClick={() => setMaintMode(!maintMode)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: maintMode ? 'var(--purple)' : 'var(--bg3)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: maintMode ? 22 : 2, transition: 'all 0.2s' }} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Allow New Signups</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Enable or disable the public registration form.</div>
            </div>
            <button onClick={() => setAllowSignups(!allowSignups)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: allowSignups ? 'var(--green)' : 'var(--bg3)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: allowSignups ? 22 : 2, transition: 'all 0.2s' }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...panel, padding: 32 }}>
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
                style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 14, outline: 'none' }} 
              />
              <button style={{ padding: '0 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Rotate Key</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>This key provides full access to the platform API. Keep it secure.</p>
          </div>

          <div style={{ padding: 20, borderRadius: 12, background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', gap: 16 }}>
            <AlertTriangle color="var(--red)" size={24} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--red)', marginBottom: 4 }}>Danger Zone</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5 }}>Actions here can cause irreversible damage to the platform data.</p>
              <button style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Purge Inactive Users</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
