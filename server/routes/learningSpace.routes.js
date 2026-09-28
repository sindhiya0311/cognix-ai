import express from 'express';
import { body } from 'express-validator';
import {
  getLearningSpaces,
  getLearningSpaceById,
  createLearningSpace,
  updateLearningSpace,
  deleteLearningSpace
} from '../controllers/learningSpace.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { SPACE_MUTABLE_FIELDS, SPACE_FIELD_LIMITS } from '../config/security.config.js';

const router = express.Router();

router.use(protect);

// Mass-assignment guard: unknown fields (owner/userId, xp, counters, ...)
// are rejected outright rather than silently ignored or applied.
const updateSpaceRules = [
  body().custom(value => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('Invalid request body');
    }
    const unknown = Object.keys(value).filter(key => !SPACE_MUTABLE_FIELDS.includes(key));
    if (unknown.length > 0) {
      throw new Error(`Field not allowed: ${unknown[0]}`);
    }
    return true;
  }),
  body('name').optional().isString()
    .trim()
    .isLength(SPACE_FIELD_LIMITS.name)
    .withMessage(`Name must be ${SPACE_FIELD_LIMITS.name.min}-${SPACE_FIELD_LIMITS.name.max} characters`),
  body('subject').optional().isString()
    .trim()
    .isLength(SPACE_FIELD_LIMITS.subject)
    .withMessage(`Subject must be at most ${SPACE_FIELD_LIMITS.subject.max} characters`),
  body('description').optional().isString()
    .isLength(SPACE_FIELD_LIMITS.description)
    .withMessage(`Description must be at most ${SPACE_FIELD_LIMITS.description.max} characters`)
];

router.get('/', getLearningSpaces);
router.post('/', createLearningSpace);
router.get('/:id', getLearningSpaceById);
router.put('/:id', ...validate(updateSpaceRules), updateLearningSpace);
router.delete('/:id', deleteLearningSpace);

export default router;
