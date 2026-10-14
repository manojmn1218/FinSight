import dotenv from 'dotenv';
import path from 'path';

// Load environment variables immediately before any routes or services load
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import http from 'http';
import https from 'https';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { initDatabase, db } from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import transactionRoutes from './routes/transactionRoutes';
import goalRoutes from './routes/goalRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import adminRoutes from './routes/adminRoutes';
import setuRoutes from './routes/setuRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (required for AWS ALB, Cloudflare, Vercel, Render, Heroku, Nginx)
app.set('trust proxy', 1);

// ═══════════════════════════════════════════════
// HTTPS ENFORCEMENT & SECURITY HEADERS (SSL/TLS)
// ═══════════════════════════════════════════════

// Enforce HTTPS redirection in production or when ENFORCE_HTTPS=true
app.use((req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const forceHttps = process.env.ENFORCE_HTTPS === 'true' || isProduction;

  if (forceHttps) {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    if (!isHttps) {
      const host = req.headers.host || `localhost:${PORT}`;
      return res.redirect(301, `https://${host}${req.originalUrl || req.url}`);
    }
    // Strict-Transport-Security (HSTS): 1 year duration, includes subdomains & preload
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Standard HTTP Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health and Diagnostics check
app.get('/api/health', (_req, res) => {
  const isHttpsEnforced = process.env.NODE_ENV === 'production' || process.env.ENFORCE_HTTPS === 'true';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: db.getStatus(),
    security: {
      httpsEnforced: isHttpsEnforced,
      hsts: isHttpsEnforced,
      trustProxy: true,
      tlsMode: process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH ? 'Native TLS' : 'Edge / Reverse Proxy TLS',
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/setu', setuRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[FinSight Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start Server
async function start() {
  await initDatabase();

  const serverPort = Number(PORT);
  const sslKeyPath = process.env.SSL_KEY_PATH;
  const sslCertPath = process.env.SSL_CERT_PATH;
  const hasDirectSsl = sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

  if (hasDirectSsl) {
    try {
      const sslOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      };
      https.createServer(sslOptions, app).listen(serverPort, '0.0.0.0', () => {
        console.log(`\n🔒 [FinSight Backend] Server running on HTTPS: https://127.0.0.1:${serverPort}`);
        console.log(`🛡️  [Security] Direct SSL/TLS Active (HSTS & HTTPS Enforced)`);
        console.log(`📡 [FinSight Backend] Mode: ${db.getStatus().mode}`);
        console.log(`🩺 [FinSight Backend] Health check: https://127.0.0.1:${serverPort}/api/health\n`);
      });
      return;
    } catch (sslErr: any) {
      console.warn('⚠️ [SSL] Failed to load direct SSL certificates, falling back to reverse proxy mode:', sslErr.message);
    }
  }

  const server = http.createServer(app);
  server.listen(serverPort, '0.0.0.0', () => {
    const isEnforced = process.env.NODE_ENV === 'production' || process.env.ENFORCE_HTTPS === 'true';
    console.log(`\n🚀 [FinSight Backend] Server running on http://127.0.0.1:${serverPort}`);
    console.log(`🛡️  [Security] HTTPS Enforcement: ${isEnforced ? 'ENABLED (Production & Proxy HSTS Active)' : 'DEV MODE (Disabled for localhost)'}`);
    console.log(`📡 [FinSight Backend] Mode: ${db.getStatus().mode}`);
    console.log(`🩺 [FinSight Backend] Health check: http://127.0.0.1:${serverPort}/api/health\n`);
  });
}

start().catch(err => {
  console.error('Failed to start FinSight server:', err);
});
