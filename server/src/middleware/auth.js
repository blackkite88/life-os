import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export function authenticate(req, res, next) {
  // Read token from cookies instead of headers
  const token = req.cookies?.auth_token;
  
  if (!token) {
    req.user = null; // Ensure req.user is null if not authenticated
    // For /api/auth/status we don't want to throw an error, just return not authenticated
    if (req.path === '/status') {
      return next(); 
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded; // { userId: '...' }
    next();
  } catch (error) {
    req.user = null;
    if (req.path === '/status') {
      return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
  }
}
