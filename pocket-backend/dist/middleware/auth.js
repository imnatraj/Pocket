import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
export const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
export function auth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
        return res.status(401).json({ message: 'Missing token' });
    }
    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = { id: decoded.sub, email: decoded.email };
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}
