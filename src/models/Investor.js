// models/Investor.js
import mongoose from 'mongoose';

const InvestorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  userType: { type: String, default: 'investor' },
  isActive: { type: Boolean, default: true },
  
  // Basic investor profile
  profile: {
    company: { type: String },
    designation: { type: String },
    investmentExperience: { type: String },
    riskProfile: { type: String, enum: ['Conservative', 'Moderate', 'Aggressive'] }
  }
}, { timestamps: true });

export default mongoose.model('Investor', InvestorSchema);
