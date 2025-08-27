// controllers/investorAuthController.js
import Investor from '../models/Investor.js';

export async function investorSignup(req, res) {
  try {
    const { email, password, name, signupData } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password and name are required' });
    }

    const existing = await Investor.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered as investor' });
    }

    const investor = await Investor.create({ 
      email, 
      password, 
      name, 
      signupData: signupData || {} 
    });

    return res.json({ 
      id: investor._id, 
      email: investor.email, 
      name: investor.name,
      userType: 'investor'
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', details: err.message });
  }
}

export async function investorLogin(req, res) {
  try {
    const { email, password } = req.body;
    
    const investor = await Investor.findOne({ email, isActive: true });
    if (!investor || investor.password !== password) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    return res.json({ 
      id: investor._id, 
      email: investor.email, 
      name: investor.name,
      userType: 'investor',
      signupData: investor.signupData 
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', details: err.message });
  }
}

export async function getInvestor(req, res) {
  try {
    const { id } = req.params;
    const investor = await Investor.findById(id);
    
    if (!investor) {
      return res.status(404).json({ error: 'not_found' });
    }

    return res.json({ 
      id: investor._id, 
      email: investor.email, 
      name: investor.name,
      userType: 'investor',
      signupData: investor.signupData 
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', details: err.message });
  }
}
