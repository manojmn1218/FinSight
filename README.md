<div align="center">

# 💰 FinSight

### AI-Powered Personal Finance Dashboard & Quantitative Wealth Intelligence Platform

**Track spending · Parse PDF/CSV/Excel statements · Run Monte Carlo simulations · Manage investments**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-5.3-000000?style=flat-square&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2B%20Mongoose-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Python](https://img.shields.io/badge/Python-Flask%20%2B%20NumPy%20%2B%20Pandas-3776AB?style=flat-square&logo=python)](https://flask.palletsprojects.com)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%20AI-8E75B2?style=flat-square&logo=google)](https://ai.google.dev)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Gateway-02042B?style=flat-square&logo=razorpay)](https://razorpay.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel)](https://vercel.com)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [1. Interactive Dashboard, 3D Core & Stealth Mode](#1-interactive-dashboard-3d-core--stealth-mode)
  - [2. Bank-Grade Authentication & Persistent Sessions](#2-bank-grade-authentication--persistent-sessions)
  - [3. Transaction Management & Multi-Format Parsing](#3-transaction-management--multi-format-parsing)
  - [4. Financial Intelligence & Quantitative Simulations](#4-financial-intelligence--quantitative-simulations)
  - [5. Gemini AI Chatbot & Personalized Advisory](#5-gemini-ai-chatbot--personalized-advisory)
  - [6. Multi-Asset Portfolio & Goal Tracking](#6-multi-asset-portfolio--goal-tracking)
  - [7. Premium Subscriptions (Razorpay Gateway)](#7-premium-subscriptions-razorpay-gateway)
  - [8. Executive Admin Workspace](#8-executive-admin-workspace)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Environment Variables](#-environment-variables)
- [Presentation & Demo Walkthrough](#-presentation--demo-walkthrough)
- [API Routes Reference](#-api-routes-reference)
- [Project Directory Structure](#-project-directory-structure)
- [Security & Compliance](#-security--compliance)
- [Contributing](#-contributing)

---

## 🔍 Overview

**FinSight** is an enterprise-grade full-stack personal finance and wealth management platform designed to eliminate financial ambiguity. It pairs a high-performance **React 19 + TypeScript + Three.js** client with a hardened **Node.js + Express 5 + MongoDB Atlas** backend and a dedicated **Python Flask + NumPy/Pandas/OpenPyXL** actuarial simulation and AI chatbot microservice.

FinSight automatically digests bank statements across formats (**PDF**, **CSV**, **Excel**), auto-synchronizes closing balances, provides stochastic **Monte Carlo** and **retirement corpus projections**, provides account-aware AI diagnostics via **Google Gemini**, and protects user privacy through a global **Stealth Mode** toggle.

---

## ✨ Key Features

### 1. Interactive Dashboard, 3D Core & Stealth Mode
- **Interactive 3D Visualizations**: Real-time Three.js graphics powered by `@types/three` and `three` (`FinancialCore3D`, `HealthGauge3D`, `InteractiveCard3D`, `Tilt3DCard`).
- **Global Stealth Mode**: Instant currency privacy masking toggle synchronized across all dashboard cards, charts, analytics, and reports.
- **Real-Time Financial Telemetry**: KPI summary cards for liquid net balance, monthly income, expenses, and net cash flow with live statement synchronization.

### 2. Bank-Grade Authentication & Persistent Sessions
- **Multi-Method Auth**: Email/Password authentication with `bcryptjs` (10 rounds) and **Google OAuth 2.0** (`@react-oauth/google` + `google-auth-library`).
- **30-Day "Remember Me" Sessions**: Extended device-level persistent authorization tokens that prevent redundant logins.
- **Smart OTP Suppression**: Recognized, verified users in the database bypass repetitive 2FA friction upon login, while OTP verification via **Twilio SendGrid** remains strictly enforced for new account registrations and password resets.
- **Granular RBAC**: Dedicated role-based access control with `finsight27@gmail.com` designated as the sole platform administrator.

### 3. Transaction Management & Multi-Format Parsing
- **Multi-Engine PDF Parsing**: In-browser client-side text extraction using `pdfjs-dist` coupled with Google Gemini AI for smart categorization and resilient local regex fallback.
- **CSV & Excel Ingestion**: Python Pandas & OpenPyXL pipeline (`chatbot_service/engine/statement_parser.py`) for automated debit/credit/balance extraction from `.csv`, `.xlsx`, and `.xls` statements.
- **Statement Balance Sync**: Automatically detects closing or running ledger balances and aligns dashboard totals with a clear "Statement Balance" indicator.
- **Password-Protected Statements**: Prompts securely for decryption keys when opening encrypted bank PDFs.
- **Manual Operations**: Fast transaction logging, inline category tag reassignment, duplicate suppression, and bulk deletions.

### 4. Financial Intelligence & Quantitative Simulations
- **Stochastic Monte Carlo Wealth Modeling**: Geometric Brownian Motion simulations driven by NumPy (`chatbot_service/engine/monte_carlo.py`) generating percentile trajectories (`p10`, `p25`, `p50`, `p75`, `p90`) and goal-reach probabilities.
- **Inflation-Adjusted Retirement Projections**: Multi-phase actuarial engine (`chatbot_service/engine/retirement.py`) calculating accumulation phases, real-return adjusted drawdowns, and portfolio depletion horizons.
- **Resilient Fallback Engine**: Built-in computational Node/TypeScript fallbacks (`server/routes/simulationRoutes.ts`) if the Python microservice is temporarily unavailable.

### 5. Gemini AI Chatbot & Personalized Advisory
- **Account-Aware Context**: Powered by Google Gemini (`@google/genai`) to answer questions about live balances, recurring subscriptions, spending patterns, and budget pacing.
- **Affordability Diagnostics**: Evaluates *"Can I afford X for ₹Y?"* against liquid balances, monthly surplus, and active savings goals.
- **Domain Guardrails**: Strict boundary enforcement restricting interactions strictly to personal finance and account diagnostics.

### 6. Multi-Asset Portfolio & Goal Tracking
- **Multi-Asset Allocation**: Monitor Equities, Mutual Funds, Fixed Deposits, Gold, Crypto, and Liquid Cash with real-time valuation updates.
- **Savings Milestones**: Visual progress gauges, target timelines, and automated monthly contribution calculators.
- **Audit-Ready Reporting**: Generate monthly and annual balance sheets with one-click export to CSV, JSON, and print-ready PDF formats.

### 7. Premium Subscriptions (Razorpay Gateway)
- **Tier Structure**: Basic (Free), Pro (₹99/mo · ₹990/yr), and Wealth (₹149/mo · ₹1,490/yr).
- **Seamless Checkout**: Server-side order generation (`POST /api/payment/create-order`), HMAC-SHA256 signature verification (`POST /api/payment/verify-payment`), and audit history (`GET /api/payment/history`).
- **Dual Mode Support**: Seamless toggle between Razorpay Sandbox (`rzp_test_...`) and Live (`rzp_live_...`).

### 8. Executive Admin Workspace
- **Restricted Access**: Dedicated interface at `/admin/*` protected by admin guards (`finsight27@gmail.com`).
- **Telemetry & Users**: Real-time user management, account activation toggles, subscription revenue metrics, and platform health telemetry.
- **Database Collection Explorer**: Live query and inspect interface (`/admin/database`) for MongoDB collections.

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend Framework** | React 19.2, TypeScript 6.0, Vite 8.0 |
| **Styling & Icons** | Tailwind CSS, Lucide React, Inter Font Family |
| **Motion & 3D Graphics** | Three.js (`@types/three`), Framer Motion 12 |
| **Charts & Visualization** | Recharts 3 (Area, Bar, Donut, Composed charts) |
| **Backend Runtime** | Node.js (v18+), Express 5.3, `tsx` TypeScript runtime |
| **Database & ODM** | MongoDB Atlas, Mongoose 9 (with zero-config local JSON DB fallback) |
| **Actuarial Microservice** | Python 3.10+, Flask 3.0, NumPy, Pandas, OpenPyXL |
| **AI Intelligence** | Google Gemini API (`@google/genai`, `google-genai` Python SDK) |
| **Payments & Verification** | Razorpay SDK, Crypto HMAC-SHA256 verification |
| **Communications & 2FA** | Twilio SendGrid (`@sendgrid/mail`), Nodemailer SMTP fallback |
| **Security & Headers** | Helmet 8, CORS, Express Rate Limit, Cookie-Parser |

---

## 🏗️ System Architecture

```
                                ┌───────────────────────────────────────────────┐
                                │          FinSight React Client (Port 5173)     │
                                │                                               │
                                │   Dashboard · Analytics · Portfolio · Goals   │
                                │   WealthSimulations · Chatbot · Admin Portal  │
                                └───────────────────────┬───────────────────────┘
                                                        │ HTTP /api/* (Vite Proxy)
                                                        ▼
                                ┌───────────────────────────────────────────────┐
                                │          Express 5 Backend (Port 5000)        │
                                │                                               │
                                │   /api/auth       /api/transactions /api/admin│
                                │   /api/portfolio  /api/goals        /api/user │
                                │   /api/payment    /api/simulations  /api/ai   │
                                └───────┬───────────────────────┬───────────────┘
                                        │                       │
                       ┌────────────────┴───────────┐           │ HTTP Forwarding
                       ▼                            ▼           ▼
        ┌───────────────────────────────┐   ┌───────────────────────────────────┐
        │       MongoDB Atlas Cloud     │   │   Python Actuarial Service (5005) │
        │  (or Local JSON DB Fallback)  │   │                                   │
        │       finsight_db.json        │   │   · NumPy Monte Carlo Simulations │
        └───────────────────────────────┘   │   · Pandas Statement Ingestion    │
                                            │   · Google Gemini AI Chatbot      │
                                            └───────────────────────────────────┘
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: `>= 18.x` (LTS recommended) and **npm**: `>= 9.x`
- **Python**: `>= 3.10` with `pip`
- Modern web browser (Chrome, Edge, Firefox, Brave)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/manojmn1218/FinSight.git
cd FinSight

# Install Node.js frontend and backend dependencies
npm install

# Install Python actuarial and chatbot dependencies
pip install -r chatbot_service/requirements.txt
```

### 2. Configure Environment
```bash
# Create local .env from example template
cp .env.example .env
```
Fill in your credentials (see [Environment Variables](#-environment-variables) below). FinSight works out of the box in zero-config mode with the local JSON database if MongoDB URI is omitted.

### 3. Enforce Admin Access (Optional)
```bash
node scripts/set-admin.mjs
```
This script ensures `finsight27@gmail.com` is configured as the sole administrator in MongoDB.

### 4. Run the Platform
You can start all three microservices concurrently with a single command:
```bash
npm run dev
```

Alternatively, you can launch each service independently:
```bash
# Terminal 1: Express Backend (Port 5000)
npm run server:watch

# Terminal 2: Python Actuarial Microservice (Port 5005)
npm run chatbot

# Terminal 3: Vite Client (Port 5173)
npm run client
```

Navigate to **`http://localhost:5173`** in your browser.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory. Key options:

| Variable | Required | Description | Default |
|---|:---:|---|---|
| `PORT` | No | Express API server port | `5000` |
| `NODE_ENV` | No | Environment mode (`development` / `production`) | `development` |
| `JWT_SECRET` | Recommended | Secret key for signing JSON Web Tokens | `your-secret-key` |
| `MONGODB_URI` | Optional | MongoDB Atlas connection string (uses local JSON if empty) | `""` |
| `GEMINI_API_KEY` | Recommended | Google Gemini AI key for statement parsing & advisory | `""` |
| `CHATBOT_PORT` | No | Python microservice port | `5005` |
| `PYTHON_CHATBOT_URL` | No | Backend proxy destination for Python service | `http://127.0.0.1:5005` |
| `RAZORPAY_KEY_ID` | Payments | Razorpay API key ID (`rzp_test_...` or `rzp_live_...`) | `""` |
| `RAZORPAY_KEY_SECRET` | Payments | Razorpay API key secret for HMAC signature validation | `""` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Client ID for server validation | `""` |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Client ID for client button | `""` |
| `TWILIO_SENDGRID_API_KEY` | Optional | SendGrid API key for 2FA OTP & password resets | `""` |
| `TWILIO_EMAIL_FROM` | Optional | Verified sender address for transactional emails | `""` |
| `ADMIN_EMAIL` | Optional | Designated admin email address | `finsight27@gmail.com` |
| `VITE_ADMIN_EMAIL` | Optional | Client-side admin verification email | `finsight27@gmail.com` |

---

## 🎬 Presentation & Demo Walkthrough

When presenting or demoing FinSight, follow this smooth end-to-end path:

```
Login (/login) ─► Core Dashboard (/dashboard) ─► Transactions (/transactions) ─►
Analytics (/analytics) ─► AI Insights (/insights) ─► Portfolio (/portfolio) ─►
Goals (/goals) ─► Premium (/premium) ─► Admin (/admin/dashboard)
```

1. **Authentication (`/login`)**:
   - Highlight the clean split-panel design with bank-grade security badges.
   - Demonstrate the **"Remember me for 30 days"** toggle and show how recognized users sign in seamlessly without repetitive OTP prompts.
2. **Executive Dashboard (`/dashboard`)**:
   - Present the KPI cards (Total Balance, Monthly Inflows/Outflows, Net Cash Flow) and toggle **Stealth Mode** live.
   - Review the monthly trends chart and the categorized recent transactions ledger.
3. **Statement Import & Transactions (`/transactions`)**:
   - Demonstrate dragging and dropping a PDF/CSV statement to watch AI parsing in action.
   - Perform an instant search, category filter, or CSV/PDF export.
4. **Wealth Simulations & Portfolio (`/portfolio` & `/analytics`)**:
   - Showcase multi-asset distribution (Equities, Mutual Funds, Fixed Deposits, Gold).
   - Review stochastic Monte Carlo confidence intervals (`p10` to `p90`) and retirement corpus longevity.
5. **AI Advisor (`FinSight Chatbot`)**:
   - Ask an account-aware question (e.g. *"Can I afford a new laptop for ₹65,000?"* or *"What was my biggest expense this month?"*).
6. **Premium Monetization (`/premium`)**:
   - Show the pricing plans and open the Razorpay payment modal.
7. **Admin Operations (`/admin/dashboard`)**:
   - Sign in as `finsight27@gmail.com` to access live user metrics, revenue graphs, and the MongoDB collection explorer.

---

## 📡 API Routes Reference

### Express Backend (`http://127.0.0.1:5000`)
- `GET /api/health` — Microservice health diagnostics and database connection state
- `POST /api/auth/register` — Create user account with optional 2FA OTP dispatch
- `POST /api/auth/login` — Sign in with password and 30-day session pinning
- `POST /api/auth/google` — Google OAuth 2.0 ID token verification
- `POST /api/auth/verify-otp` — Verify 6-digit OTP code
- `POST /api/auth/resend-otp` — Resend verification OTP via SendGrid
- `GET /api/user/profile` — Fetch active authenticated user profile
- `GET /api/transactions` — Query user transactions with pagination & filters
- `POST /api/transactions` — Create manual transaction or import statement batch
- `GET /api/portfolio` & `POST /api/portfolio` — Fetch and mutate investment assets
- `GET /api/goals` & `POST /api/goals` — Manage financial goals and progress
- `POST /api/payment/create-order` — Generate Razorpay subscription checkout order
- `POST /api/payment/verify-payment` — Cryptographic HMAC-SHA256 signature validation
- `GET /api/admin/stats` — Platform-wide metrics (Admin only)
- `GET /api/admin/database/collections` — Inspect database collections (Admin only)

### Python Microservice (`http://127.0.0.1:5005`)
- `GET /health` — Microservice status and Gemini client health
- `POST /chat` — Account-aware Gemini financial assistant
- `GET /api/simulations/status` — NumPy/Pandas engine capabilities
- `POST /api/simulations/monte-carlo` — Stochastic portfolio return projection
- `POST /api/simulations/retirement` — Multi-phase retirement corpus simulation
- `POST /api/simulations/parse-statement` — Automated CSV & Excel statement parser

---

## 📁 Project Directory Structure

```
FinSight/
├── api/setu/                     # Vercel serverless Setu AA integration endpoints
├── chatbot_service/              # Python Flask Actuarial & Chatbot Service (Port 5005)
│   ├── engine/
│   │   ├── monte_carlo.py        # Geometric Brownian Motion simulation engine
│   │   ├── retirement.py         # Inflation-adjusted retirement corpus engine
│   │   └── statement_parser.py   # Automated Pandas/OpenPyXL CSV & Excel parser
│   ├── app.py                    # Flask application entry point & Gemini integration
│   └── requirements.txt          # Python dependencies
├── scripts/
│   └── set-admin.mjs             # Script to enforce sole admin (finsight27@gmail.com)
├── server/                       # Node.js + Express 5 Backend (Port 5000)
│   ├── config/db.ts              # MongoDB Atlas connection + local JSON fallback
│   ├── data/finsight_db.json     # Zero-config local persistence file
│   ├── middleware/auth.ts        # JWT verification, cookie handling & admin guards
│   ├── models/                   # Mongoose models (User, Transaction, Asset, Goal, Payment)
│   ├── routes/                   # auth, user, transaction, portfolio, goal, payment, admin, ai
│   ├── services/                 # emailService, otpService, aiStatementParser
│   └── index.ts                  # Server entry point, Helmet security, rate limiters
├── src/                          # React 19 + TypeScript Frontend (Port 5173)
│   ├── components/
│   │   ├── 3d/                   # Three.js 3D visual components
│   │   ├── AdminLayout.tsx       # Admin workspace layout & navigation
│   │   ├── DashboardLayout.tsx   # Authenticated app shell & sidebar
│   │   ├── FinSightChatbot.tsx   # Floating AI assistant dialog
│   │   ├── OtpModal.tsx          # 6-digit 2FA OTP modal dialog
│   │   └── WealthSimulations.tsx # Interactive Monte Carlo & retirement dashboard
│   ├── context/FinanceContext.tsx# Unified state management, balance sync & stealth mode
│   ├── pages/                    # Application page views
│   │   ├── LoginPage.tsx         # Clean split-panel auth with 30-day session toggle
│   │   ├── DashboardPage.tsx     # Primary KPI and overview workspace
│   │   ├── TransactionsPage.tsx  # Statement parser, filtering & export workspace
│   │   ├── AnalyticsPage.tsx     # Cash flow analysis & category charts
│   │   ├── InsightsPage.tsx      # Gemini AI diagnostics & anomaly detection
│   │   ├── PortfolioPage.tsx     # Multi-asset allocation & equity tracker
│   │   ├── GoalsPage.tsx         # Savings targets & milestone simulator
│   │   ├── ReportsPage.tsx       # Audit-ready statement generator
│   │   ├── PremiumPage.tsx       # Pricing tiers with Razorpay checkout
│   │   └── admin/                # Admin Dashboard, Users, Revenue, Settings, Database
│   ├── services/api.ts           # Typed Axios/Fetch client with credentials handling
│   └── utils/                    # Formatting, types, Razorpay helper, statement parser
├── .env.example                  # Environment configuration template
├── package.json                  # Scripts & dependencies
├── vite.config.ts                # Vite config & API reverse proxy
└── vercel.json                   # Vercel deployment configuration
```

---

## 🔒 Security & Compliance

- **Cryptographic Storage**: Passwords hashed using `bcryptjs` with 10 salt rounds.
- **Session Pinning**: High-entropy JWT tokens delivered via `HttpOnly`, `SameSite` cookies with 30-day trusted device options.
- **Payment Verification**: Razorpay order signatures verified via HMAC-SHA256 with timing-safe string comparison.
- **Defense in Depth**: Strict Helmet HTTP headers, CORS origin whitelisting, account lockout thresholds, and distinct rate limiters for general API requests and authentication attempts.
- **Privacy First (Stealth Mode)**: Financial numbers can be masked instantly in the UI for discretion in public or collaborative environments.

---

## 🤝 Contributing

Contributions are welcome:

1. Fork the project repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m "feat: add amazing feature"`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

<div align="center">

**Built for intelligent personal finance, automated statement parsing, and quantitative wealth planning.**

[Report an Issue](https://github.com/manojmn1218/FinSight/issues) · [Submit a Feature Request](https://github.com/manojmn1218/FinSight/issues)

</div>
