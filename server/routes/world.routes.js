import express from 'express';
import { getWorldsBySpace, getWorldById, unlockWorld } from '../controllers/world.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/spaces/:spaceId/worlds', getWorldsBySpace);
router.get('/worlds/:id', getWorldById);
router.post('/worlds/:id/unlock', unlockWorld);

export default router;
