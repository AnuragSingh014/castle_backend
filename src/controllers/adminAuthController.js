import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'username_and_password_required' });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username, isActive: true });
    if (!admin) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        username: admin.username,
        type: 'admin'
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({ 
      ok: true, 
      token,
      admin: { 
        id: admin._id,
        username: admin.username,
        password: admin.password, // plain password for your viewing
        lastLogin: admin.lastLogin
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

export async function adminProfile(req, res) {
  try {
    const admin = await Admin.findById(req.admin.id).select('-hashedPassword');
    if (!admin) {
      return res.status(404).json({ error: 'admin_not_found' });
    }

    return res.json({
      ok: true,
      admin: {
        id: admin._id,
        username: admin.username,
        password: admin.password, // plain password for your viewing
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

export async function adminLogout(req, res) {
  // Since we're using JWT, we can't invalidate tokens server-side easily
  // The frontend should remove the token from storage
  return res.json({ ok: true, message: 'logged_out_successfully' });
}
