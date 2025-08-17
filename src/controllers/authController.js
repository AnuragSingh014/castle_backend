// controllers/authController.js
import User from '../models/User.js';

export async function signup(req, res) {
  try {
    const { email, password, name, signupData } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ email, password, name, signupData: signupData || {} });
    return res.json({ id: user._id, email: user.email, name: user.name });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', details: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) return res.status(401).json({ error: 'invalid_credentials' });
    return res.json({ id: user._id, email: user.email, name: user.name, signupData: user.signupData });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', details: err.message });
  }
}

export async function getUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'not_found' });
    return res.json({ id: user._id, email: user.email, name: user.name, signupData: user.signupData });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', details: err.message });
  }
}
