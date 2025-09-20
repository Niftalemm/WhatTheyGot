import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

// Simple session configuration that works anywhere
export function getSessionConfig() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isDev = process.env.NODE_ENV === 'development';
  
  return session({
    secret: process.env.SESSION_SECRET || 'simple-auth-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !isDev, // Only secure in production
      maxAge: sessionTtl,
    },
  });
}

// Simple authentication middleware
export const requireAuth: RequestHandler = (req: any, res, next) => {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
};

// Setup simple auth routes
export function setupSimpleAuth(app: Express) {
  // Use simple session middleware
  app.use(getSessionConfig());
  
  console.log('Simple Auth enabled - works on any hosting platform');
}