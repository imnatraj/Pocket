import { ZodError } from 'zod';
export function errorHandler(err, _req, res, _next) {
    if (err instanceof ZodError) {
        return res.status(400).json({ message: 'Validation failed', issues: err.issues });
    }
    const status = err.status || 500;
    const message = err.message || 'Internal error';
    if (status >= 500) {
        console.error('[server error]', err);
    }
    else {
        console.warn('[client error]', message);
    }
    res.status(status).json({ message });
}
export const asyncH = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
