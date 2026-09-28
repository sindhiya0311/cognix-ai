import express from 'express';
import { body } from 'express-validator';
import { startGameSession, getGameChallenge, submitGameAttempt } from '../controllers/game.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { ATTEMPT_ALLOWED_FIELDS, GAME_TYPES, ATTEMPT_BOUNDS } from '../config/security.config.js';

const router = express.Router();

router.use(protect);

// Learning-evidence boundary: only allowlisted fields are accepted and every
// numeric influence on XP/mastery is hard-bounded. Privileged fields
// (mastery, xp, level, streak, unlocks, identity...) are rejected with 400.
const attemptRules = [
  body().custom(value => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('Invalid request body');
    }
    const unknown = Object.keys(value).filter(key => !ATTEMPT_ALLOWED_FIELDS.includes(key));
    if (unknown.length > 0) {
      throw new Error(`Field not allowed: ${unknown[0]}`);
    }
    return true;
  }),
  body('spaceId').isString().isLength({ min: 1, max: 64 })
    .withMessage('spaceId is required'),
  body('worldId').isString().isLength({ min: 1, max: 64 })
    .withMessage('worldId is required'),
  body('game').isIn(GAME_TYPES)
    .withMessage('Unknown game type'),
  body('correct').isBoolean({ strict: true })
    .withMessage('correct must be a boolean'),
  body('confidence').optional().isFloat(ATTEMPT_BOUNDS.confidence).toFloat()
    .withMessage('confidence must be between 0 and 1'),
  body('seconds').optional().isFloat(ATTEMPT_BOUNDS.seconds).toFloat()
    .withMessage('seconds must be between 0 and 3600'),
  body('difficulty').optional().isInt(ATTEMPT_BOUNDS.difficulty).toInt()
    .withMessage('difficulty must be between 1 and 4'),
  body('hintUsed').optional().isBoolean({ strict: true })
    .withMessage('hintUsed must be a boolean'),
  body('id').optional().isString().isLength({ max: 64 })
    .withMessage('id must be a short string'),
  body('timestamp').optional()
];

router.post('/worlds/:worldId/game/start', startGameSession);
router.get('/worlds/:worldId/game/challenge', getGameChallenge);
router.post('/games/:sessionId/attempt', ...validate(attemptRules), submitGameAttempt);
router.post('/games/attempt', ...validate(attemptRules), submitGameAttempt);

export default router;
