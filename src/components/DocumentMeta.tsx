import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_META: Record<string, { title: string; desc: string }> = {
  '/dashboard': {
    title: 'FinSight — Financial Intelligence Dashboard',
    desc: 'Monitor real-time net worth, monthly cashflow, anomaly detection, and budget health score.',
  },
  '/transactions': {
    title: 'Transactions & Statements — FinSight',
    desc: 'Parse and extract bank statements with high accuracy. Review categorized debit and credit logs.',
  },
  '/manual-entry': {
    title: 'Manual Transaction Hub — FinSight',
    desc: 'Log and manage custom debit, credit, investments, and loan transactions in one unified ledger.',
  },
  '/analytics': {
    title: 'Analytics & Trends — FinSight',
    desc: 'Deep spending distribution analytics, monthly cashflow bars, and categorized budget health.',
  },
  '/reports': {
    title: 'Financial Reports — FinSight',
    desc: 'Comprehensive financial summaries, cashflow exports, and automated audit breakdowns.',
  },
  '/insights': {
    title: 'AI Insights & Anomalies — FinSight',
    desc: 'Intelligent spending recommendations, recurring charge alerts, and cashflow optimization tips.',
  },
  '/portfolio': {
    title: 'Portfolio & Wealth Engine — FinSight',
    desc: 'Consolidated tracking for mutual funds, Indian equities, US tech stocks, gold, and real estate.',
  },
  '/goals': {
    title: 'Financial Goals & Milestones — FinSight',
    desc: 'Track and allocate capital toward emergency funds, home down payments, and retirement targets.',
  },
  '/export': {
    title: 'Data Export Center — FinSight',
    desc: 'Export parsed financial records and statement summaries in CSV, JSON, and PDF formats.',
  },
  '/profile': {
    title: 'Profile & Security — FinSight',
    desc: 'Manage account credentials, two-factor authentication, currency preferences, and session logs.',
  },
  '/premium': {
    title: 'Premium & Wealth Tiers — FinSight',
    desc: 'Unlock AI statement parsing, multi-asset portfolio analytics, and dedicated CFP advisor sessions.',
  },
  '/support': {
    title: 'Support & Help Desk — FinSight',
    desc: 'Contact FinSight technical support, submit inquiries, or explore documentation and live chat.',
  },
  '/legal': {
    title: 'Legal, DMCA & Privacy Hub — FinSight',
    desc: 'Designated DMCA agent, California ARL auto-renewal terms, COPPA compliance, and CIPA privacy disclosures.',
  },
  '/login': {
    title: 'Sign In — FinSight',
    desc: 'Sign in to your FinSight personal finance account securely with OTP or Google OAuth.',
  },
  '/signup': {
    title: 'Create Your Account — FinSight',
    desc: 'Join FinSight to take control of your financial future with bank statement intelligence.',
  },
  '/forgot-password': {
    title: 'Reset Password — FinSight',
    desc: 'Request a secure OTP verification code to reset your account password.',
  },
  '/onboarding': {
    title: 'Account Onboarding — FinSight',
    desc: 'Complete your personal finance profile, primary income, and baseline monthly budget.',
  },
};

export default function DocumentMeta() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let meta = ROUTE_META[path];

    if (!meta && path.startsWith('/admin')) {
      meta = {
        title: 'Admin Executive Console — FinSight',
        desc: 'Administrative controls, database studio, revenue metrics, and user management.',
      };
    }

    if (!meta) {
      meta = {
        title: 'FinSight — Intelligent Personal Finance',
        desc: 'Track bank statements, monitor budget health, and consolidate portfolio assets securely.',
      };
    }

    document.title = meta.title;

    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    descTag.setAttribute('content', meta.desc);
  }, [location.pathname]);

  return null;
}
