import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/error.middleware.js';
import { protect } from './middleware/auth.middleware.js';
import { rateLimit, validateNovaInput } from './middleware/security.middleware.js';

import authRoutes from './routes/auth.routes.js';
import learningSpaceRoutes from './routes/learningSpace.routes.js';
import syllabusRoutes from './routes/syllabus.routes.js';
import worldRoutes from './routes/world.routes.js';
import gameRoutes from './routes/game.routes.js';
import learnerRoutes from './routes/learner.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import { askNovaMentor } from './services/ai.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'GameLearn API is running' });
});

// AI Nova Mentor Route — rate limited + validated
const novaLimiter = rateLimit({ windowMs: 60000, maxRequests: 20, message: 'NOVA rate limit exceeded. Please wait a moment.' });
app.post('/api/nova/ask', protect, novaLimiter, validateNovaInput, async (req, res, next) => {
  try {
    const { context, query, space, world, decision } = req.body;
    const fullContext = context || { learningSpace: space, world, decision };
    const reply = await askNovaMentor(fullContext, query);
    res.json({ success: true, reply });
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/spaces', learningSpaceRoutes);
app.use('/api', syllabusRoutes);
app.use('/api', worldRoutes);
app.use('/api', rateLimit({ windowMs: 60000, maxRequests: 30, message: 'Game API rate limit exceeded.' }), gameRoutes);
app.use('/api', learnerRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', resourceRoutes);

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] GameLearn AI Server listening on port ${PORT}`);
  console.log(`[Server] Health Check available at http://localhost:${PORT}/api/health`);
});
