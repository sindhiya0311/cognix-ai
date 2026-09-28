import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { body } from 'express-validator';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/error.middleware.js';
import { protect } from './middleware/auth.middleware.js';
import { rateLimit, loginRateLimit, registerRateLimit, verifyNovaContext } from './middleware/security.middleware.js';
import { validate } from './middleware/validation.middleware.js';
import {
  RATE_LIMITS,
  JSON_BODY_LIMIT,
  NOVA_QUERY_MAX_LENGTH,
  NOVA_CONTEXT_MAX_BYTES,
  CORS_ORIGIN,
  findJwtSecretDefect
} from './config/security.config.js';

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

// --- Fail fast on a missing or weak JWT secret (never fall back to a default) ---
const jwtSecretDefect = findJwtSecretDefect(process.env.JWT_SECRET);
if (jwtSecretDefect) {
  console.error(`[Security] FATAL: ${jwtSecretDefect}`);
  console.error("[Security] Generate a strong secret with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Connect Database
connectDB();

// --- Basic HTTP security headers (low-risk, CSP deferred — see vish.md) ---
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('X-Permitted-Cross-Domain-Policies', 'none');
  if (isProduction) res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  next();
});

// --- CORS ---
// CORS_ORIGIN (comma-separated) wins when set. Otherwise development stays
// permissive (Vite runs on another port) and production defaults to
// same-origin only (no CORS headers) for a safe fail-closed default.
const corsOptions = CORS_ORIGIN.length
  ? { origin: CORS_ORIGIN }
  : (isProduction ? { origin: false } : {});
app.use(cors(corsOptions));

// Explicit body size cap (same value as the express default, now centralized).
app.use(express.json({ limit: JSON_BODY_LIMIT }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'GameLearn API is running' });
});

// Validation rules for the NOVA endpoint (malformed input → 400, no detail leaks).
const novaRules = [
  body('query').isString().isLength({ min: 1, max: NOVA_QUERY_MAX_LENGTH })
    .withMessage('Query must be a string of at most 1000 characters'),
  body('context').optional({ values: 'falsy' }).isObject().withMessage('Context must be an object')
    .custom(ctx => {
      if (ctx && JSON.stringify(ctx).length > NOVA_CONTEXT_MAX_BYTES) {
        throw new Error('Context payload too large');
      }
      return true;
    })
];

// AI Nova Mentor Route — authenticated, rate limited, validated, ownership-checked.
const novaLimiter = rateLimit({
  windowMs: RATE_LIMITS.nova.windowMs,
  maxRequests: RATE_LIMITS.nova.max,
  message: RATE_LIMITS.nova.message
});
app.post(
  '/api/nova/ask',
  protect,
  novaLimiter,
  ...validate(novaRules),
  verifyNovaContext,
  async (req, res, next) => {
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
app.use('/api', rateLimit({ ...RATE_LIMITS.game, maxRequests: RATE_LIMITS.game.max }), gameRoutes);
app.use('/api', learnerRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', resourceRoutes);

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] GameLearn AI Server listening on port ${PORT}`);
  console.log(`[Server] Health Check available at http://localhost:${PORT}/api/health`);
});
