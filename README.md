<div align="center">

# 💰 FinSight

### AI-Powered Personal Finance Dashboard

**Track spending · Analyze patterns · Get smart insights · Manage investments**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

FinSight is a comprehensive personal finance management platform that transforms raw bank statements into actionable financial intelligence. Upload a PDF bank statement or connect your bank via Setu Account Aggregator, and FinSight automatically parses transactions, categorizes spending, detects recurring payments, and generates AI-powered insights — all within a beautiful, responsive dashboard.

### Who is it for?

- 🧑‍💻 **Individuals** looking to understand and optimize their spending habits
- 📊 **Freelancers** who need clear income vs. expense tracking
- 🎯 **Goal setters** who want to track savings targets with visual progress
- 📈 **Investors** managing a multi-asset portfolio with live stock data

---

## ✨ Features

### 🏦 Transaction Management
- **PDF Statement Parser** — Upload bank statements (SBI, HDFC, ICICI, Kotak, Axis, etc.) with automatic transaction extraction
- **Password-Protected PDFs** — Handles encrypted bank statements with a secure password prompt
- **Setu Account Aggregator** — Connect bank accounts directly via India's AA framework for real-time data
- **Smart Categorization** — Auto-categorizes transactions into Food, Transport, Utilities, Shopping, Subscriptions, and more
- **Inline Editing** — Re-categorize or delete transactions with a single click
- **Duplicate Detection** — Prevents double-importing when uploading the same statement

### 📊 Dashboard & Analytics
- **Financial Overview** — Real-time cards for balance, income, expenses, and net cash flow
- **Budget Health Score** — Dynamic gauge that rates your financial health (0–100)
- **Monthly Trend Charts** — Area and bar charts visualizing income vs. expenses over time
- **Category Breakdown** — Interactive pie chart showing spending distribution
- **Recurring Payment Detection** — Identifies subscriptions and recurring debits with cost alerts
- **Cumulative Savings Timeline** — Track how your savings grow month over month

### 🤖 AI-Powered Insights *(Pro)*
- **Spending Anomaly Detection** — Flags unusual transaction amounts
- **Subscription Creep Alerts** — Warns when recurring costs increase
- **Savings Optimization** — Personalized tips to increase savings rate
- **Cash Flow Predictions** — Forecasts future balances based on patterns
- **Tax Optimization Hints** — Category-level spending analysis for tax planning

### 📈 Portfolio & Investments *(Enterprise)*
- **Multi-Asset Tracking** — Mutual Funds, Equity, Crypto, Gold, Real Estate, Cash
- **Live Stock Quotes** — Real-time prices via Alpha Vantage API with caching
- **AI Stock Recommendations** — Personalized picks based on your risk profile and portfolio
- **Net Worth Timeline** — Historical chart of total portfolio value
- **Auto-Detected Assets** — Identifies investments from bank transactions

### 🎯 Financial Goals
- **Create & Track Goals** — Set savings targets with deadlines and visual progress bars
- **Contribute Funds** — Add contributions and watch progress in real time
- **Color-Coded Cards** — Each goal gets a unique visual identity

### 📋 Reports & Export
- **Financial Reports** — Comprehensive reports with monthly summaries, category breakdowns, and budget variance analysis
- **Multi-Format Export** — Download as CSV, JSON, or formatted PDF
- **Date Range Filtering** — Export specific time periods
- **Print-Ready** — Clean report layouts optimized for printing

### 🔐 Authentication & Security
- **Secure Signup/Login** — Password hashing with salted SHA-256
- **Password Strength Enforcement** — Min 8 chars, uppercase, number, special character
- **Brute Force Protection** — Account lockout after 5 failed attempts (15-minute cooldown)
- **Session Management** — 24-hour auto-expiry with live countdown timer
- **Content Security Policy** — CSP headers restricting scripts, styles, and connections
- **Route Guards** — Protected routes with automatic redirect for unauthenticated users

### 👑 Premium Tiers
| Feature | Basic (Free) | Pro (₹349/mo) | Enterprise (₹999/mo) |
|---------|:---:|:---:|:---:|
| Manual expense entry | ✅ | ✅ | ✅ |
| Dashboard & charts | ✅ | ✅ | ✅ |
| PDF uploads | 3/month | Unlimited | Unlimited |
| AI Insights | ❌ | ✅ | ✅ |
| Recurring alerts | ❌ | ✅ | ✅ |
| Investment tracking | ❌ | ❌ | ✅ |
| Live stock data | ❌ | ❌ | ✅ |
| Priority support | ❌ | ✅ | ✅ |

### 🛡️ Admin Panel
- **Executive Dashboard** — Platform-wide metrics and KPIs
- **User Management** — View, search, and manage registered users
- **Revenue Analytics** — Track subscription revenue and plan distribution
- **Platform Settings** — Configure system-wide settings

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript 6 | UI components with type safety |
| **Build** | Vite 8 | Lightning-fast HMR and builds |
| **Routing** | React Router 7 | SPA navigation with nested routes |
| **Charts** | Recharts 3 | Area, bar, pie, and composed charts |
| **Animations** | Framer Motion 12 | Page transitions and micro-animations |
| **Icons** | Lucide React | 1000+ clean, consistent icons |
| **PDF Parsing** | pdf.js (pdfjs-dist) | Extract text from bank statement PDFs |
| **Stock Data** | Alpha Vantage API | Live BSE/NSE stock quotes |
| **Bank Connect** | Setu Account Aggregator | Direct bank account data via AA framework |
| **Backend** | Vercel Serverless Functions | Setu API proxy (keeps secrets server-side) |
| **Deployment** | Vercel | Auto-deploy from Git with edge CDN |
| **Styling** | Vanilla CSS | Custom design system with CSS variables |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│                                                              │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Login /  │  │ Dashboard │  │Analytics │  │  Portfolio  │ │
│  │  Signup   │  │   Page    │  │  Page    │  │    Page     │ │
│  └─────┬────┘  └─────┬─────┘  └────┬─────┘  └─────┬──────┘ │
│        │              │             │              │         │
│        └──────────────┴──────┬──────┴──────────────┘         │
│                              │                               │
│                    ┌─────────┴─────────┐                     │
│                    │  FinanceContext    │                     │
│                    │  (State + Auth)    │                     │
│                    └─────────┬─────────┘                     │
│                              │                               │
│              ┌───────────────┼───────────────┐               │
│              │               │               │               │
│     ┌────────┴───┐   ┌──────┴─────┐  ┌──────┴──────┐       │
│     │ localStorage│   │ setuApi.ts │  │ stockApi.ts │       │
│     │ (Auth+Data) │   │ (Bank API) │  │ (Stocks)    │       │
│     └────────────┘   └──────┬─────┘  └──────┬──────┘       │
│                              │               │               │
└──────────────────────────────┼───────────────┼───────────────┘
                               │               │
                    ┌──────────┴──────┐  ┌─────┴──────────┐
                    │  Vercel Funcs   │  │ Alpha Vantage  │
                    │  /api/setu/*    │  │   (via proxy)  │
                    └──────────┬──────┘  └────────────────┘
                               │
                    ┌──────────┴──────┐
                    │   Setu AA API   │
                    │  (Bank Data)    │
                    └─────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or pnpm/yarn)
- A modern browser (Chrome, Firefox, Edge, Safari)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/FinSight.git
cd FinSight

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Quick Start

1. **Sign up** with any email and a strong password
2. **Complete onboarding** — set your name, income, expenses, and savings goal
3. **Upload a bank statement** (PDF) on the Transactions page, or use Setu AA to connect your bank
4. **Explore** — Dashboard, Analytics, Reports, Goals, and Portfolio pages auto-populate from your data

---

## 🔑 Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|:--------:|-------------|
| `SETU_CLIENT_ID` | For bank connect | Setu AA API client ID |
| `SETU_CLIENT_SECRET` | For bank connect | Setu AA API secret |
| `SETU_PRODUCT_INSTANCE_ID` | For bank connect | Setu product instance ID |
| `SETU_BASE_URL` | No | Setu API URL (`https://aa-sandbox.setu.co` for sandbox) |
| `SETU_REDIRECT_URL` | No | Redirect URL after consent approval |
| `VITE_SETU_MOCK` | No | Set to `true` to use mock bank data (default in dev) |

> **Note:** The app works fully without Setu credentials — it falls back to mock data in development. Alpha Vantage API keys are entered by users in the Portfolio page UI.

---

## 📁 Project Structure

```
FinSight/
├── api/                          # Vercel serverless functions
│   └── setu/
│       ├── create-consent.ts     # POST — Create Setu AA consent
│       ├── consent-status.ts     # GET  — Check consent status
│       ├── fetch-data.ts         # POST — Fetch bank FI data
│       └── webhook.ts            # POST — Setu event notifications
│
├── public/                       # Static assets
│   ├── favicon.svg
│   ├── FT.png                    # Logo (full size)
│   └── ft.jpeg                   # Logo (compact)
│
├── src/
│   ├── components/
│   │   ├── AdminLayout.tsx       # Admin panel sidebar + layout
│   │   ├── BankConnect.tsx       # Setu AA multi-step connection modal
│   │   └── DashboardLayout.tsx   # Main app sidebar + layout
│   │
│   ├── context/
│   │   └── FinanceContext.tsx     # Global state, auth, CRUD operations
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx         # Login with password + brute force protection
│   │   ├── SignupPage.tsx        # Registration with strength validation
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── OnboardingPage.tsx    # 4-step guided setup wizard
│   │   ├── DashboardPage.tsx     # Main financial overview
│   │   ├── TransactionsPage.tsx  # Upload, search, filter, edit transactions
│   │   ├── AnalyticsPage.tsx     # Charts, category breakdown, trends
│   │   ├── InsightsPage.tsx      # AI-powered spending insights (Pro)
│   │   ├── ReportsPage.tsx       # Financial reports + print view
│   │   ├── GoalsPage.tsx         # Savings goal tracker
│   │   ├── PortfolioPage.tsx     # Investment tracking + live quotes
│   │   ├── ExportPage.tsx        # CSV/JSON/PDF export
│   │   ├── PremiumPage.tsx       # Plan comparison + upgrade flow
│   │   ├── ProfilePage.tsx       # User profile settings
│   │   ├── SupportPage.tsx       # Help & support
│   │   ├── AdminDashboardPage.tsx
│   │   ├── AdminUsersPage.tsx
│   │   ├── AdminRevenuePage.tsx
│   │   └── AdminSettingsPage.tsx
│   │
│   ├── utils/
│   │   ├── transactionParser.ts  # PDF parsing, categorization, recurring detection
│   │   ├── setuApi.ts            # Setu AA frontend API client
│   │   ├── setuMockData.ts       # Mock data for development
│   │   ├── setuTransformer.ts    # Raw Setu data → Transaction transformer
│   │   ├── stockApi.ts           # Alpha Vantage API + caching
│   │   └── types.ts              # TypeScript interfaces & category config
│   │
│   ├── App.tsx                   # Route definitions + auth guards
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Design system (CSS variables, components)
│   └── App.css                   # Minimal app-level styles
│
├── .env.example                  # Environment variable template
├── index.html                    # HTML entry with CSP headers
├── vite.config.ts                # Vite config with API proxy
├── vercel.json                   # Vercel deployment config
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

---

## 🔒 Security

FinSight implements multiple layers of security:

| Layer | Implementation |
|-------|---------------|
| **Password Storage** | Salted hash (never stored in plain text) |
| **Password Policy** | Min 8 chars + uppercase + number + special character |
| **Brute Force** | Account lockout after 5 failed attempts (15 min) |
| **Session Mgmt** | 24-hour auto-expiry with countdown timer |
| **Route Protection** | `ProtectedRoute` and `AdminRoute` wrappers |
| **CSP Headers** | Restricts script, style, font, image, and connect sources |
| **X-Content-Type** | `nosniff` to prevent MIME-type sniffing |
| **Referrer Policy** | `strict-origin-when-cross-origin` |
| **XSS Prevention** | No `dangerouslySetInnerHTML`, `innerHTML`, or `eval()` |
| **API Secrets** | Setu credentials server-side only (Vercel functions) |
| **Input Validation** | Regex validation on API inputs (mobile number, IDs) |
| **Method Enforcement** | All API routes reject unexpected HTTP methods (405) |

> **Note:** Authentication is currently client-side (localStorage). For production with real financial data, integrate a backend auth provider (Firebase Auth, Supabase, or custom JWT server).

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Add environment variables (Setu credentials) in Project Settings → Environment Variables
4. Deploy — Vercel auto-detects Vite and configures the build

```bash
# Or deploy via CLI
npx vercel --prod
```

### Manual Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

The output is in `dist/` — serve it with any static file server.

---

## 🗺️ Roadmap

- [ ] 🔐 Backend authentication (Firebase / Supabase)
- [ ] 📱 Progressive Web App (PWA) with offline support
- [ ] 🔔 Push notifications for bill reminders
- [ ] 📊 More bank statement formats (Excel, OFX, QIF)
- [ ] 🤖 GPT-powered natural language financial queries
- [ ] 📧 Email reports and weekly summaries
- [ ] 🌍 Multi-currency support
- [ ] 🏦 Additional Account Aggregator FIPs

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for smarter personal finance**

[Report Bug](https://github.com/your-username/FinSight/issues) · [Request Feature](https://github.com/your-username/FinSight/issues)

</div>
