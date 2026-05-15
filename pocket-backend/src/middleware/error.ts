import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  status?: number;
}

export function errorHandler(
  err: AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation failed', issues: err.issues });
  }

  const status = (err as AppError).status || 500;
  const message = err.message || 'Internal error';

  if (status >= 500) {
    console.error('[server error]', err);
  } else {
    console.warn('[client error]', message);
  }

  res.status(status).json({ message });
}

export const asyncH =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
