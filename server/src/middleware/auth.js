import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export function authenticate(req, res, next) {
  // Mock authentication for now
  // In a real app, verify jwt from req.headers.authorization
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // For local dev, bypass auth
    req.user = { id: 1, name: 'Local User' };
    return next();
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
