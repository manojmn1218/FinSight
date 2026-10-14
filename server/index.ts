import dotenv from 'dotenv';
import path from 'path';

// Load environment variables immediately before any routes or services load
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health and Diagnostics check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: db.getStatus(),
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
  app.listen(serverPort, '0.0.0.0', () => {
    console.log(`\n🚀 [FinSight Backend] Server running on http://127.0.0.1:${serverPort}`);
    console.log(`📡 [FinSight Backend] Mode: ${db.getStatus().mode}`);
    console.log(`🩺 [FinSight Backend] Health check: http://127.0.0.1:${serverPort}/api/health\n`);
  });
}

start().catch(err => {
  console.error('Failed to start FinSight server:', err);
});
