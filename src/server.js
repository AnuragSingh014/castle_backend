// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import DashboardData from './models/DashboardData.js';
import { connectDatabase } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';


import investorAuthRoutes from './routes/investorAuthRoutes.js';
import investorDashboardRoutes from './routes/investorDashboardRoutes.js';
/* ── setup ────────────────────────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config();

const app = express();

/* ── CORS  (allow Vercel, Netlify, local dev, plus fallback) ─ */
const ALLOWED_ORIGINS = [
  'https://castle-ao8s-dpxwms7h7-anuragsingh014s-projects.vercel.app', // public front-end (Vercel)
  'https://mellow-kitsune-a5b57d.netlify.app',                         // admin panel   (Netlify)
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176'
];

app.use(
  cors({
    origin(origin, cb) {
      // allow non-browser tools (no Origin) OR anything in the whitelist
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      // fallback: allow every other site as well (you requested “allow everyone”)
      return cb(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,                       // keep cookies / auth headers
    exposedHeaders: ['Content-Disposition']  // let browser read filename
  })
);

/* ── global middleware ───────────────────────────────────── */
app.use(express.json());

/* ── static files ─────────────────────────────────────────── */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── routes ──────────────────────────────────────────────── */
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/investor-auth', investorAuthRoutes);
app.use('/api/investor-dashboard', investorDashboardRoutes);
/* health-check */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* fallback list of published companies (legacy) */
app.get('/api/public/companies', async (_req, res) => {
  try {
    const publishedCompanies = await DashboardData.find({
      isDisplayedOnWebsite: true,
      isComplete: true
    })
      .populate('userId', 'name email')
      .select('information overview images createdAt updatedAt')
      .sort({ updatedAt: -1 });

    return res.json({ success: true, companies: publishedCompanies });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'internal_server_error' });
  }
});

/* ── start HTTP + Socket.IO ───────────────────────────────── */
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

app.set('io', io);     // make io available to controllers

io.on('connection', socket => {
  socket.on('join:user',  userId => socket.join(`user:${userId}`));
  socket.on('join:admin', ()     => socket.join('admin'));
});

/* ── DB + listen ─────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
await connectDatabase(process.env.MONGO_URI);
server.listen(PORT, () =>
  console.log(`Backend listening on http://localhost:${PORT}`)
);
