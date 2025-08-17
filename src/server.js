// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import DashboardData from './models/DashboardData.js';

import { connectDatabase } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import publicRoutes from './routes/publicRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.json());

// ✅ Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve static files from uploads directory
// app.use('/uploads', express.static('uploads'));
app.use('/api/public', publicRoutes);
// health
app.get('/api/health', (req, res) => res.json({ ok: true }));


// routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/public/companies', async (req, res) => {
  try {
    const publishedCompanies = await DashboardData.find({ 
      isDisplayedOnWebsite: true,
      isComplete: true 
    })
    .populate('userId', 'name email')
    .select('information overview images createdAt updatedAt')
    .sort({ updatedAt: -1 });
    
    return res.json({ 
      success: true,
      companies: publishedCompanies 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'internal_server_error' 
    });
  }
});

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

// make io available to controllers
app.set('io', io);

// simple rooms: user:<userId> and admin
io.on('connection', socket => {
  socket.on('join:user', (userId) => socket.join(`user:${userId}`));
  socket.on('join:admin', () => socket.join('admin'));
  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;
await connectDatabase(process.env.MONGO_URI);
server.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
