import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Session is invalid or expired.' });
  }
  try {
    const [rows] = await pool.execute('SELECT id, name, email, role, is_active AS isActive FROM users WHERE id = ? LIMIT 1', [claims.sub]);
    const user = rows[0];
    if (!user || !Boolean(Number(user.isActive))) return res.status(401).json({ error: 'This account is inactive or no longer exists. Sign in again or contact an Admin.' });
    req.user = { ...claims, sub: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (error) { next(error); }
}
export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}
