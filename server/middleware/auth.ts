import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/db';
import type { UserDocument } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'finsight_super_secret_jwt_key_2026_secured!';
export const AUTH_COOKIE_NAME = 'fs_auth_token';

export interface AuthenticatedRequest extends Request {
  user?: UserDocument;
}

export function generateToken(user: UserDocument): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Sets HttpOnly, Secure, SameSite JWT Cookie
 */
export function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction || process.env.ENFORCE_HTTPS === 'true';

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isProduction ? 'strict' : 'lax', // 'lax' for local cross-origin Vite dev, 'strict' in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

/**
 * Clears HttpOnly Auth Cookie on logout
 */
export function clearAuthCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction || process.env.ENFORCE_HTTPS === 'true';

  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  // 1. Check HttpOnly cookie first (Highest security against XSS)
  const cookieToken = req.cookies ? req.cookies[AUTH_COOKIE_NAME] : null;

  // 2. Check Authorization Bearer header as fallback
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; isAdmin: boolean };
    const user = await db.findUserByEmail(decoded.email);

    if (!user) {
      res.status(401).json({ error: 'User associated with token no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
}
