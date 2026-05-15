import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

export interface UserPayload {
  sub: string;
  email: string;
  displayName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
      };
    }
  }
}

export const signToken = (payload: UserPayload) => 
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES as any });

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, SECRET) as UserPayload;
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
