import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'FINSIGHT_PLACEHOLDER_CLIENT_ID';

// Initialize theme from localStorage or system preference
const savedTheme = localStorage.getItem('finsight_theme');
if (savedTheme === 'light') {
  document.body.classList.add('light');
} else if (savedTheme === 'dark') {
  document.body.classList.remove('light');
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
  document.body.classList.add('light');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)

