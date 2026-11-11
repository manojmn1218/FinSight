<div align="center">

# 💰 FinSight

### AI-Powered Personal Finance Dashboard & Wealth Intelligence Platform

**Track spending · Parse PDF/CSV/Excel statements · Run Monte Carlo simulations · Manage investments**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-5.3-000000?style=flat-square&logo=express)](https://expressjs.com)
[![Python](https://img.shields.io/badge/Python-Flask%20%2B%20NumPy%2FPandas-3776AB?style=flat-square&logo=python)](https://flask.palletsprojects.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel)](https://vercel.com)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Routes Overview](#-api-routes-overview)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

---

## 🔍 Overview

FinSight is a full-stack personal finance and wealth management platform combining a **React 19 + TypeScript + Three.js** client, a **Node.js + Express 5 + MongoDB Atlas** REST API (with zero-config local JSON persistence fallback), and a **Python Flask + NumPy/Pandas/OpenPyXL** analytics and AI chatbot microservice.

Upload PDF, CSV, or Excel bank statements (or link accounts via Setu Account Aggregator) to extract and categorize transactions, monitor net cash flow, toggle **Stealth Mode** for privacy, run stochastic **Monte Carlo** and **retirement simulations**, ask the **FinSight AI Chatbot** account-aware questions, and manage subscriptions via **Razorpay**.

### Who is it for?

- 🧑‍💻 **Individuals** looking to understand and optimize spending habits with privacy controls
- 📊 **Freelancers** tracking multi-source income vs. expenses and recurring bills
- 🎯 **Goal setters** planning savings milestones and inflation-adjusted retirement targets
- 📈 **Investors** managing multi-asset portfolios with quantitative projections

---

## ✨ Features

### 🏦 Transaction Management & Statement Parsing
- **Multi-Format Statement Ingestion** — Parses **PDF** statements (`pdfjs-dist` in-browser + Google Gemini AI + local regex fallbacks) as well as **CSV and Excel (`.csv`, `.xlsx`, `.xls`)** statements through the Python Pandas/OpenPyXL engine.
- **Statement Closing Balance Sync** — Detects closing/available or running ledger balances and synchronizes account balances with a "Statement Balance" indicator.
- **Password-Protected PDFs** — Prompts securely when opening encrypted bank statements.
- **Manual Entry & Inline Editing** — Dedicated Manual Entry workspace (`ManualEntryPage`) and single-click category updates, deletions, and duplicate filtering.
- **Setu Account Aggregator** — Consent flow, status polling, data fetch, and webhook integration via `/api/setu/*` and Vercel serverless functions (`api/setu/`), with mock development mode (`VITE_SETU_MOCK`).

### 📊 Dashboard, 3D Visuals & Stealth Mode
- **Financial Overview** — Real-time KPI cards for total balance, monthly income, expenses, and net cash flow.
- **Interactive 3D Components** — Three.js visualizations (`FinancialCore3D`, `HealthGauge3D`, `InteractiveCard3D`, `Tilt3DCard`) powered by `@types/three` and `three`.
- **Stealth Mode (Privacy Masking)** — Global currency masking toggle synchronized across Dashboard, Analytics, Insights, Reports, Portfolio, and Wealth Simulations.
- **Monthly Trends & Breakdowns** — Interactive Recharts area, bar, pie, and composed charts with recurring debit alerts and cumulative savings timelines.

### 🧮 Python Financial Intelligence & Wealth Simulations
- **Stochastic Monte Carlo Portfolio Forecasting** — Geometric Brownian Motion simulations powered by NumPy (`chatbot_service/engine/monte_carlo.py`) generating percentile trajectories (`p10`, `p25`, `p50`, `p75`, `p90`) and target goal probabilities.
- **Inflation-Adjusted Retirement Projections** — Multi-phase corpus simulation (`chatbot_service/engine/retirement.py`) modeling pre-retirement contributions, inflation-adjusted post-retirement drawdowns, and depletion year indicators.
- **Resilient Backend Fallback** — Node/TypeScript simulation routes (`server/routes/simulationRoutes.ts`) provide built-in computational fallbacks if the Python microservice is offline.

### 💬 FinSight AI Chatbot *(Python + Gemini)*
- **Account-Aware Assistant** — Built with Python Flask and Google Gemini (`google-genai`) to answer questions about balances, category spending, recurring bills, and FinSight features.
- **Affordability Checks** — Evaluates *"Can I afford [item] for ₹[amount]?"* queries against liquid balance, monthly surplus, and savings goals.
- **Domain Guardrails** — Keeps conversations strictly scoped to personal finance and FinSight account data.

### 📈 Portfolio, Investments & AI Insights
- **Multi-Asset Tracking *(Wealth)*** — Track Equities, Mutual Funds, Crypto, Gold, Real Estate, and Cash with Alpha Vantage quote integration and server-managed key handling.
- **AI-Powered Insights *(Pro & Wealth)*** — Anomaly detection, subscription creep alerts, cash-flow insights, and personalized savings recommendations.
- **Goals & Reports** — Color-coded savings goals with deadline tracking plus CSV, JSON, and print-ready PDF exports.

### 💳 Premium Plans & Razorpay Payment Gateway
| Feature | Basic (Free) | Pro (₹99/mo · ₹990/yr) | Wealth (₹149/mo · ₹1,490/yr) |
|---------|:---:|:---:|:---:|
| Manual expense entry & charts | ✅ | ✅ | ✅ |
| PDF uploads | Up to 3/month | Unlimited | Unlimited |
| AI-powered insights & recurring alerts | ❌ | ✅ | ✅ |
| Budget health score & gauge | ❌ | ✅ | ✅ |
| CSV / PDF / Excel exports | CSV only | ✅ | ✅ |
| Investment & portfolio tracking | ❌ | ❌ | ✅ |
| Crypto, Net Worth & Wealth Simulations | ❌ | ❌ | ✅ |
| Priority support & advisor features | ❌ | Email Support | Priority + Advisor |

- **Razorpay Checkout** — Server-side order creation (`POST /api/payment/create-order`), HMAC-SHA256 payment signature verification (`POST /api/payment/verify-payment`), and payment history (`GET /api/payment/history`), supporting both Test (`rzp_test_...`) and Live (`rzp_live_...`) keys.

### 🔐 Authentication, Security & Admin Panel
- **Multi-Method Sign-In** — Email/Password (bcrypt 10 salt rounds) and **Google OAuth 2.0** (`@react-oauth/google` + `google-auth-library`).
- **OTP Verification & Password Reset** — Email OTP verification and reset flows powered by **Twilio SendGrid** (`@sendgrid/mail`) or Nodemailer SMTP fallback.
- **Session & Route Protection** — Signed JWT tokens delivered via `HttpOnly` cookies / Bearer auth, brute-force account lockout, Helmet security headers, CORS origin restrictions, and API/auth rate limiting.
- **Admin Console** — Dedicated `/admin/*` workspace featuring **Executive Dashboard**, **User Management**, **Revenue Analytics**, **Platform Settings**, and a live **Database Collection Explorer** (`/admin/database`). Admin access defaults to `finsight27@gmail.com` (`ADMIN_EMAIL` / `VITE_ADMIN_EMAIL`) and can be synchronized via `scripts/set-admin.mjs`.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript 6 | Component UI with strict type safety |
| **Build & Tooling** | Vite 8 + `tsx` + `concurrently` | HMR client, TypeScript watch backend, unified dev runner |
| **3D & Motion** | Three.js + Framer Motion 12 | Interactive 3D wealth/gauge graphics and transitions |
| **Data Visualization** | Recharts 3 + Lucide React | Responsive financial charts and SVG iconography |
| **Backend Server** | Node.js + Express 5 | REST API, JWT/Cookie auth, rate limiting, Razorpay checkout |
| **Database** | MongoDB Atlas (Mongoose 9) | Cloud persistence with local JSON DB fallback (`server/data/finsight_db.json`) |
| **Python Microservice** | Flask + NumPy + Pandas + OpenPyXL | Monte Carlo simulations, retirement projections, Excel/CSV parsing, Gemini chat |
| **AI & Integrations** | `@google/genai`, `google-auth-library`, `razorpay`, `@sendgrid/mail`, `nodemailer` | Statement AI parsing, OAuth 2.0, payments, transactional OTP emails |
| **PDF & Open Banking** | `pdfjs-dist`, Setu AA, Alpha Vantage | In-browser PDF text extraction, AA bank linking, market quotes |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                   FinSight React Frontend (Port 5173)                │
│                                                                      │
│   Dashboard · Analytics · Portfolio · WealthSimulations · Chatbot    │
│   Transactions · Goals · Reports · Premium (Razorpay) · Admin        │
│                    │                                │                │
│             FinanceContext                  src/services/api.ts      │
└────────────────────┼────────────────────────────────┼────────────────┘
                     │   HTTP /api/* (Vite Proxy)     │
                     ▼                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                Node.js Express 5 Backend (Port 5000)                 │
│                                                                      │
│  /api/auth     /api/user      /api/transactions   /api/goals         │
│  /api/portfolio /api/admin    /api/setu           /api/ai            │
│  /api/chatbot  /api/simulations  /api/payment     /api/health        │
└──────────┬──────────────────┬────────────────────────┬───────────────┘
           │                  │                        │
           ▼                  ▼                        ▼
┌───────────────────┐ ┌──────────────────────┐ ┌───────────────────────┐
│ MongoDB Atlas OR  │ │ Python Flask Engine  │ │ External Providers    │
│ Local JSON Fallback│ │ (Port 5005)          │ │ · Google Gemini AI    │
│ finsight_db.json  │ │ · NumPy Monte Carlo  │ │ · Razorpay Checkout   │
└───────────────────┘ │ · Pandas Parser      │ │ · Google OAuth 2.0    │
                      │ · Gemini Chatbot     │ │ · SendGrid / Setu AA  │
                      └──────────────────────┘ └───────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>= 18.x` and **npm** `>= 9.x`
- **Python** `>= 3.10` with `pip`
- A modern browser (Chrome, Edge, Firefox, Safari)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/manojmn1218/FinSight.git
cd FinSight

# 2. Install Node.js dependencies
npm install

# 3. Install Python microservice dependencies
pip install -r chatbot_service/requirements.txt

# 4. Copy environment template and add your keys
cp .env.example .env

# 5. Start Frontend (5173), Backend (5000), and Python Service (5005) concurrently
npm run dev
```

Open `http://localhost:5173` in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts Node backend (`5000`), Vite client (`5173`), and Python service (`5005`) together |
| `npm run client` | Starts Vite development server on port `5173` |
| `npm run server` | Starts Express backend once (`tsx server/index.ts`) |
| `npm run server:watch` | Starts Express backend in watch mode |
| `npm run chatbot` | Starts Python Flask analytics & chatbot service on port `5005` |
| `npm run build` | Type-checks with `tsc -b` and creates production bundle in `dist/` |
| `npm run lint` | Runs ESLint across all TypeScript/TSX files |
| `npm run preview` | Previews the production Vite build |
| `node scripts/set-admin.mjs` | Promotes `finsight27@gmail.com` as the sole MongoDB admin account |

---

## 🔑 Environment Variables

Configure these in `.env` (see [`.env.example`](.env.example)):

| Variable | Required | Description |
|----------|:--------:|-------------|
| `PORT` | No | Express backend port (default: `5000`) |
| `NODE_ENV` | No | `development` or `production` |
| `JWT_SECRET` | Recommended | Secret used to sign/verify JWT session tokens |
| `MONGODB_URI` | Optional | MongoDB Atlas URI; falls back to `server/data/finsight_db.json` when omitted |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for statement parsing and AI chatbot |
| `CHATBOT_PORT` | No | Python Flask service port (default: `5005`) |
| `PYTHON_CHATBOT_URL` | No | Express proxy target for Python service (default: `http://127.0.0.1:5005`) |
| `RAZORPAY_KEY_ID` | For payments | Razorpay Key ID (`rzp_test_...` or `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | For payments | Razorpay Key Secret for HMAC signature verification |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Web Client ID (backend verification) |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Web Client ID (frontend button) |
| `TWILIO_SENDGRID_API_KEY` / `SENDGRID_API_KEY` | Optional | SendGrid API key for OTP verification & password reset emails |
| `TWILIO_EMAIL_FROM` / `EMAIL_FROM` | Optional | Verified sender email for OTP messages |
| `ADMIN_EMAIL` / `VITE_ADMIN_EMAIL` | Optional | Designated admin account email (default: `finsight27@gmail.com`) |
| `SETU_CLIENT_ID` / `SETU_CLIENT_SECRET` / `SETU_PRODUCT_INSTANCE_ID` | Optional | Setu Account Aggregator API credentials |
| `SETU_BASE_URL` / `SETU_REDIRECT_URL` / `VITE_SETU_MOCK` | Optional | Setu environment & mock toggle (`true` for dev mock data) |
| `ENFORCE_HTTPS` / `FRONTEND_URL` / `ALLOWED_ORIGINS` | Production | TLS enforcement and CORS origin allowlist |

> **Zero-Config Local Mode:** FinSight works immediately without cloud database or payment keys — user data persists locally in `server/data/finsight_db.json` and Setu AA supports development mock mode.

---

## 📡 API Routes Overview

**Express Backend (`http://127.0.0.1:5000`)**
- `GET /api/health` — Server status, database mode, and TLS diagnostics
- `/api/auth/*` — Register, login, Google OAuth, OTP verify/resend, forgot/reset password, `/me`, logout
- `/api/user/*` — Profile read/update, account reset, data wipe
- `/api/transactions/*` — Transaction list, creation/import, inline update, delete
- `/api/goals/*` & `/api/portfolio/*` — Savings goals and investment holdings CRUD
- `/api/simulations/*` — Proxy & fallback for `/status`, `/monte-carlo`, `/retirement`, `/parse-statement`
- `/api/ai/*` & `/api/chatbot/*` — Gemini statement parsing, transaction reclassification, chatbot proxy
- `/api/payment/*` — Razorpay `/config`, `/create-order`, `/verify-payment`, `/history`
- `/api/setu/*` — Setu AA consent creation, status check, FI data fetch, webhook
- `/api/admin/*` — Admin stats, user management, and database collection explorer

**Python Microservice (`http://127.0.0.1:5005`)**
- `GET /health` & `POST /chat` — Service health check and Gemini financial assistant
- `GET /api/simulations/status` — NumPy/Pandas/OpenPyXL runtime capabilities
- `POST /api/simulations/monte-carlo` — Stochastic Monte Carlo wealth forecast
- `POST /api/simulations/retirement` — Inflation-adjusted retirement corpus simulation
- `POST /api/simulations/parse-statement` — Automated CSV/Excel bank statement parser

---

## 📁 Project Structure

```
FinSight/
├── api/setu/                     # Vercel serverless Setu AA endpoints + _types.ts
├── chatbot_service/              # Python Flask microservice (Port 5005)
│   ├── engine/
│   │   ├── monte_carlo.py        # Geometric Brownian Motion wealth simulations
│   │   ├── retirement.py         # Inflation-adjusted retirement projection engine
│   │   └── statement_parser.py   # Automated Pandas/OpenPyXL CSV & Excel parser
│   ├── app.py                    # Flask routes, Gemini integration & guardrails
│   └── requirements.txt
├── scripts/
│   └── set-admin.mjs             # Script to enforce sole admin (finsight27@gmail.com)
├── server/                       # Node.js + Express 5 Backend (Port 5000)
│   ├── config/db.ts              # MongoDB Atlas + local JSON fallback manager
│   ├── data/                     # Local persistent DB file (when MONGODB_URI unset)
│   ├── middleware/auth.ts        # JWT auth, cookie parsing & admin guards
│   ├── models/                   # Mongoose models (Asset, Goal, Payment, Transaction, User)
│   ├── routes/                   # admin, ai, auth, chatbot, goal, payment, portfolio, setu, simulation, transaction, user
│   ├── services/                 # aiStatementParser, emailService, otpService, twilioService
│   ├── types/razorpay.d.ts       # Razorpay SDK TypeScript declarations
│   ├── utils/helpers.ts          # Error extraction, Express param coercion & JSON transforms
│   └── index.ts                  # Express app entry point, Helmet, CORS & rate limiters
├── src/                          # React 19 + TypeScript Frontend (Port 5173)
│   ├── components/
│   │   ├── 3d/                   # FinancialCore3D, HealthGauge3D, InteractiveCard3D, Tilt3DCard
│   │   ├── AdminLayout.tsx
│   │   ├── BankConnect.tsx
│   │   ├── CategoryIcon.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── DocumentMeta.tsx
│   │   ├── FinSightChatbot.tsx
│   │   ├── FinSightLogo.tsx
│   │   ├── OtpModal.tsx
│   │   ├── PrivacyConsentBanner.tsx
│   │   └── WealthSimulations.tsx # Monte Carlo & Retirement simulation UI
│   ├── context/FinanceContext.tsx
│   ├── pages/                    # Dashboard, Transactions, ManualEntry, Analytics, Insights,
│   │                             # Reports, Goals, Portfolio, Export, Premium, Profile, Support,
│   │                             # Login, Signup, ForgotPassword, Onboarding, Legal, ComingSoon,
│   │                             # NotFound & Admin (Dashboard, Users, Revenue, Settings, Database)
│   ├── services/api.ts           # Typed API client with credential/JWT handling
│   └── utils/                    # format, razorpay, setuApi, setuMockData, setuTransformer, stockApi, transactionParser, types
├── .env.example                  # Environment variable template
├── index.html                    # HTML entry with CSP headers & Razorpay script support
├── vite.config.ts                # Vite proxy (/api -> 5000, /api/alphavantage)
├── vercel.json                   # Vercel build & /api rewrites
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── package.json
```

---

## 🔒 Security

| Layer | Implementation |
|-------|---------------|
| **Password Hashing** | `bcryptjs` with 10 salt rounds |
| **Session Tokens** | Signed JWT tokens in `HttpOnly` cookies & `Authorization` headers |
| **OAuth & OTP** | Google ID token verification (`google-auth-library`) & SendGrid/SMTP OTP verification |
| **Payment Integrity** | Server-side Razorpay order verification using HMAC-SHA256 signatures |
| **Rate Limiting & Lockout** | Global API limiter (400 req/15m), strict Auth limiter (25 req/15m), failed login lockouts |
| **HTTP Security** | Helmet headers, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, optional HTTPS redirect & HSTS |
| **Data Privacy** | Strict secret isolation from client bundles + in-app **Stealth Mode** currency masking |

---

## 🌐 Deployment

### Vercel (Frontend + Setu Serverless API)
1. Push your repository to GitHub and import it on [vercel.com](https://vercel.com).
2. `vercel.json` is preconfigured with `npm run build`, output directory `dist`, and `/api/*` rewrites.
3. Add environment variables in **Project Settings → Environment Variables**.
4. Note that the persistent Express server (`server/`) and Python Flask engine (`chatbot_service/`) can be hosted separately (e.g., Render, Railway, or a VM) and connected via `VITE_API_URL` and `PYTHON_CHATBOT_URL`.

### Production Build Check

```bash
npm run lint
npm run build
npm run preview
```

---

## 🗺️ Roadmap

- [x] 🔐 Express 5 backend with MongoDB Atlas & local JSON fallback
- [x] 🤖 Google Gemini AI statement parsing & closing balance sync
- [x] 📈 NumPy/Pandas financial simulations (Monte Carlo & Retirement projections)
- [x] 📊 Automated CSV & Excel (`.csv`, `.xlsx`, `.xls`) bank statement parsing
- [x] 💬 Python Flask FinSight AI Chatbot with domain guardrails
- [x] 💳 Razorpay payment gateway & subscription tier management (Basic, Pro, Wealth)
- [x] 🛡️ Google OAuth 2.0, SendGrid/SMTP Email OTP & Stealth Mode privacy masking
- [ ] 📱 Progressive Web App (PWA) with offline support
- [ ] 🔔 Scheduled bill reminders & recurring alert notifications
- [ ] 📂 Legacy bank statement formats (OFX, QIF)
- [ ] 🌍 Multi-currency portfolio support

---

## 🤝 Contributing

Contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to your branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

<div align="center">

**Built for smarter personal finance & quantitative wealth planning**

[Report Bug](https://github.com/manojmn1218/FinSight/issues) · [Request Feature](https://github.com/manojmn1218/FinSight/issues)

</div>
