import { Request, Response, NextFunction } from 'express';
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
export declare const signToken: (payload: UserPayload) => string;
export declare function auth(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
