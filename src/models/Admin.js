import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // plain text for your viewing
  hashedPassword: { type: String, required: true }, // for security
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// ✅ CORRECT: Use regular function (NOT arrow function)
AdminSchema.pre('save', async function(next) {
  console.log('🔧 Pre-save hook triggered');
  
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    console.log('🔧 Password not modified, skipping');
    return next();
  }
  
  try {
    console.log('🔧 Hashing password...');
    const salt = await bcrypt.genSalt(12);
    this.hashedPassword = await bcrypt.hash(this.password, salt);
    console.log('🔧 Password hashed successfully');
    next();
  } catch (error) {
    console.log('🔧 Error hashing password:', error);
    next(error);
  }
});

// Method to compare password
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.hashedPassword);
};

export default mongoose.model('Admin', AdminSchema);
