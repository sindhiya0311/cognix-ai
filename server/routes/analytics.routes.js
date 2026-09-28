import express from 'express';
import { getAnalyticsBySpace } from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/spaces/:spaceId/analytics', getAnalyticsBySpace);

export default router;
