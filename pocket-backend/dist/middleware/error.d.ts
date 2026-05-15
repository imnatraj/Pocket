import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
export interface AppError extends Error {
    status?: number;
}
export declare function errorHandler(err: AppError | ZodError, _req: Request, res: Response, _next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare const asyncH: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
