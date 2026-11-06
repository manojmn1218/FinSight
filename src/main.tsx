import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'FINSIGHT_PLACEHOLDER_CLIENT_ID';

// Enforce unified signature theme across all pages & devices
document.body.classList.remove('light');
localStorage.removeItem('finsight_theme');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)

