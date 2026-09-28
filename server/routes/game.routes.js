import express from 'express';
import { startGameSession, getGameChallenge, submitGameAttempt } from '../controllers/game.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/worlds/:worldId/game/start', startGameSession);
router.get('/worlds/:worldId/game/challenge', getGameChallenge);
router.post('/games/:sessionId/attempt', submitGameAttempt);
router.post('/games/attempt', submitGameAttempt);

export default router;
