// scripts/createAdmin.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';
import { connectDatabase } from '../config/db.js';

async function createAdmin() {
  try {
    await connectDatabase();
    console.log('Connected to database');
    
    const username = 'admin@company.com';
    const password = 'supersecret123';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.username);
      console.log('Plain password:', existingAdmin.password);
      return;
    }

    console.log('Creating new admin...');

    // ✅ Manually hash the password before saving
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin with both plain and hashed passwords
    const admin = new Admin({
      username,
      password, // plain text for your viewing
      hashedPassword // manually hashed
    });

    await admin.save();

    console.log('✅ Admin created successfully!');
    console.log('Username:', admin.username);
    console.log('Plain password:', admin.password);
    console.log('Has hashed password:', !!admin.hashedPassword);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await mongoose.connection.close();
  }
}

createAdmin();
