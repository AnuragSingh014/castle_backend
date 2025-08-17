// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // plain by your requirement
  name: { type: String },
  signupData: { type: Object, default: {} },

  // prefer not to keep a duplicate dashboard blob here to avoid divergence
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
