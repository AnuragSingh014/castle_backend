import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function adminAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized', message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'unauthorized', message: 'Invalid token format' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if admin exists and is active
    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'unauthorized', message: 'Admin not found or inactive' });
    }

    // Attach admin info to request
    req.admin = {
      id: admin._id,
      username: admin.username
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'unauthorized', message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'unauthorized', message: 'Token expired' });
    }
    
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
