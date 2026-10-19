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
- **PDF Statement Parser & AI Extraction** — Multi-tier parser powered by Google Gemini AI with resilient local regex fallbacks, extracting transactions from SBI, HDFC, ICICI, Kotak, Axis, and other Indian banks
- **Statement Closing Balance Sync** — Automatically detects the final closing/available balance or multi-column running ledger balance and synchronizes it directly to the dashboard with a green "Statement Balance" badge
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

### 💬 FinSight AI Chatbot *(Python-Powered)*
- **Dedicated In-App Financial Intelligence Co-pilot** — An interactive assistant built with Python (Flask) and Google Gemini AI (`gemini-3.5-flash-lite`) to guide users through FinSight and answer questions about their account requirements, balances, and finances.
- **Deep Account Requirements & Affordability Engine** — Trained to evaluate purchase feasibility in real time (*"Can I afford to buy [item] for ₹[amount] right now?"*). Checks current liquid balance, monthly surplus (income minus expenses), and active savings goals, providing clear affordability verdicts and exact cash deficit/surplus figures.
- **Comprehensive Expense & Category Intelligence** — Accurately analyzes category spending breakdowns (Education, Shopping, Utilities, Food, Transport, etc.), pinpoints the largest single expense on record with date and merchant, and tracks recurring subscriptions.
- **Goals & Milestone Requirements** — Tracks active targets, percentage completion, remaining capital needed, and deadlines. For users with no active goals, it guides them on setting targets or calculates required monthly savings.
- **Budget Health Scoring & Tailored Guidance** — Provides personalized 0–100 Budget Health Scores with concrete, actionable advice based on real account numbers and cash-flow patterns.
- **Strict Domain Scope Guardrail** — Strictly restricted to only answer questions about the FinSight platform and the authenticated user's account details. Any out-of-scope question (general knowledge, coding, politics, weather, trivia) returns a polite refusal: *"Cannot say. As FinSight's dedicated AI assistant, I only answer questions related to the FinSight website, its features, and your personal account details."*
- **Always-Available Drawer** — Accessible across every dashboard page with quick-prompt chips, sleek typing indicators, and markdown formatting.

### 📈 Portfolio & Investments *(Enterprise)*
- **Multi-Asset Tracking** — Mutual Funds, Equity, Crypto, Gold, Real Estate, Cash
- **Real-Time Market Analytics** — Curated market quotes for Indian ADRs and Global equities with intelligent client-side caching and resilient baseline fallbacks
- **AI Stock Recommendations & SIP Planner** — Personalized picks and SIP allocations based on your risk profile and surplus
- **Net Worth Timeline** — Historical chart of total portfolio value
- **Zero Sensitive UI Exposure** — Removed sensitive user-facing API key panels; quotes are managed smoothly without requiring users to expose or manage third-party keys
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
- **SMS OTP Verification** — Phone number verification via Twilio SMS for secure account registration and identity confirmation
- **Secure Signup/Login** — Password hashing with bcrypt (10 rounds) and signed JWT bearer tokens
- **Password Strength Enforcement** — Min 8 chars, uppercase, number, special character
- **Brute Force Protection** — Account lockout after 5 failed attempts (15-minute cooldown)
- **Session Management** — 24-hour auto-expiry with live countdown timer
- **Content Security Policy** — CSP headers restricting scripts, styles, and connections
- **Route Guards** — Protected routes with automatic redirect for unauthenticated users
- **Sensitive Data Isolation** — All third-party secrets and keys are strictly decoupled from client-side UI components

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
| **Build & Tooling**| Vite 8 + tsx + concurrently | High-speed HMR and concurrent frontend/backend development |
| **Backend Server** | Node.js + Express 5 (REST) | Full backend API with JWT authentication and middleware |
| **Database** | MongoDB Atlas (Mongoose ODM) | Cloud database with smart local persistent JSON fallback |
| **Security** | bcryptjs + jsonwebtoken | Server-side password hashing (10 salt rounds) & signed JWT tokens |
| **Routing** | React Router 7 | SPA navigation with protected routes and role checks |
| **Charts** | Recharts 3 | Area, bar, pie, and composed charts |
| **Animations** | Framer Motion 12 | Page transitions and micro-animations |
| **Icons** | Lucide React | Clean, modern vector icons |
| **PDF Parsing** | pdf.js (pdfjs-dist) | Extract text and transactions from bank statement PDFs |
| **Stock Data** | Alpha Vantage API | Live BSE/NSE market and equity quotes |
| **Bank Connect** | Setu Account Aggregator | Direct bank account data via India's AA framework |
| **AI Chatbot Service** | Python 3 + Flask + google-genai | Dedicated scoped chatbot microservice with dual-layer domain guardrails |
| **Styling** | Vanilla CSS | Bespoke design system with CSS tokens and dark mode |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FinSight React Frontend                  │
│                                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Login /  │  │ Dashboard │  │Analytics │  │  Portfolio  │  │
│  │  Signup   │  │   Page    │  │  Page    │  │    Page     │  │
│  └─────┬────┘  └─────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│        │              │             │              │          │
│        └──────────────┴──────┬──────┴──────────────┘          │
│                              │                                │
│                     ┌────────┴─────────┐                      │
│                     │  FinanceContext  │                      │
│                     │  (Optimistic UI) │                      │
│                     └────────┬─────────┘                      │
│                              │ (JWT Bearer Token)             │
│                     ┌────────┴─────────┐                      │
│                     │  api.ts Service  │                      │
│                     └────────┬─────────┘                      │
└──────────────────────────────┼────────────────────────────────┘
                               │
                HTTP /api REST Requests (Vite Proxy)
                               │
┌──────────────────────────────┼────────────────────────────────┐
│               Node.js Express REST Backend (Port 5000)        │
│                                                               │
│  ┌──────────────┐   ┌───────────────┐   ┌─────────────────┐   │
│  │ Auth Routes  │   │  User Routes  │   │ Transaction API │   │
│  │ (bcrypt/JWT) │   │ (Profile/Plan)│   │ (CRUD & Import) │   │
│  └──────┬───────┘   └───────┬───────┘   └────────┬────────┘   │
│         │                   │                    │            │
│  ┌──────┴───────┐   ┌───────┴───────┐   ┌────────┴────────┐   │
│  │ Goals Routes │   │Portfolio Route│   │ Setu AA Routes  │   │
│  └──────┬───────┘   └───────┬───────┘   └────────┬────────┘   │
│         │                   │                    │            │
│         └───────────────────┼────────────────────┘            │
│                             │                                 │
│                  ┌──────────┴──────────┐                      │
│                  │  db.ts (Data Layer) │                      │
│                  └──────────┬──────────┘                      │
└─────────────────────────────┼─────────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
    ┌────────────────────┐        ┌───────────────────────┐
    │   MongoDB Atlas    │   OR   │ Local Persistent DB   │
    │  (When MONGODB_URI │        │(server/data/db.json)  │
    │    is configured)  │        │ (Zero-config fallback)│
    └────────────────────┘        └───────────────────────┘
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
| `PORT` | No | Backend Express server port (default: `5000`) |
| `JWT_SECRET` | Recommended | Secret key for signing and verifying JWT authentication tokens |
| `MONGODB_URI` | No (Cloud Atlas) | MongoDB Atlas connection string (`mongodb+srv://...`). When omitted, FinSight uses local persistent JSON database storage (`server/data/finsight_db.json`) |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for AI bank statement parsing and chatbot intelligence |
| `CHATBOT_PORT` | No | Python Chatbot microservice port (default: `5005`) |
| `PYTHON_CHATBOT_URL` | No | Python chatbot service URL for Express proxy (default: `http://127.0.0.1:5005`) |
| `TWILIO_ACCOUNT_SID` | Optional | Twilio account SID for mobile SMS OTP verification |
| `TWILIO_AUTH_TOKEN` | Optional | Twilio auth token for SMS OTP verification |
| `TWILIO_PHONE_NUMBER` | Optional | Twilio sender phone number |
| `SETU_CLIENT_ID` | For bank connect | Setu AA API client ID |
| `SETU_CLIENT_SECRET` | For bank connect | Setu AA API secret |
| `SETU_PRODUCT_INSTANCE_ID` | For bank connect | Setu product instance ID |
| `SETU_BASE_URL` | No | Setu API URL (`https://aa-sandbox.setu.co` for sandbox) |
| `SETU_REDIRECT_URL` | No | Redirect URL after consent approval |
| `VITE_SETU_MOCK` | No | Set to `true` to use mock bank data (default in dev) |

> **Note:** The app works fully without cloud credentials! It runs out-of-the-box using the local persistent database and mock bank data. When you are ready to connect MongoDB Atlas, just set `MONGODB_URI` in `.env`.

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
├── chatbot_service/              # Python AI Chatbot Microservice
│   ├── app.py                    # Flask application with Gemini & domain guardrails
│   └── requirements.txt          # Python dependencies
│
├── server/                       # Node.js + Express REST Backend
│   ├── config/                   # Database & server configuration
│   ├── data/                     # Local persistent JSON database fallback
│   ├── middleware/               # Auth (JWT), rate limiting, security middleware
│   ├── models/                   # Mongoose / schema models (User, Transaction, Goal)
│   ├── routes/                   # API routes (auth, user, transaction, chatbot, otp)
│   ├── services/                 # aiStatementParser (Gemini), twilioService, otpService
│   └── index.ts                  # Backend server entry point
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
| **Password Storage** | bcrypt (10 salt rounds, salted hash never stored in plain text) |
| **Two-Factor Auth** | Phone number verification via Twilio SMS OTP |
| **Password Policy** | Min 8 chars + uppercase + number + special character |
| **Brute Force** | Account lockout after 5 failed attempts (15 min) |
| **Session Mgmt** | Signed JWT bearer tokens with 24-hour auto-expiry & live countdown |
| **Route Protection** | `ProtectedRoute` and `AdminRoute` wrappers |
| **CSP Headers** | Restricts script, style, font, image, and connect sources |
| **X-Content-Type** | `nosniff` to prevent MIME-type sniffing |
| **Referrer Policy** | `strict-origin-when-cross-origin` |
| **XSS Prevention** | No `dangerouslySetInnerHTML`, `innerHTML`, or `eval()` |
| **API Secrets** | Third-party secrets stored securely in environment variables, isolated from UI |
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

- [x] 🔐 Full Node.js + Express backend with MongoDB Atlas & JWT authentication
- [x] 🤖 Gemini AI-powered statement parsing & closing balance sync
- [x] 📱 Phone SMS OTP verification (Twilio)
- [x] 🛡️ Sensitive API credential shielding on Portfolio & UI views
- [x] 💬 Dedicated in-app FinSight Chatbot (Python-powered website guidance & user account assistant)
- [ ] 📱 Progressive Web App (PWA) with offline support
- [ ] 🔔 Push notifications for bill reminders
- [ ] 📊 More bank statement formats (Excel, OFX, QIF)
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
