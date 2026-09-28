import express from 'express';
import {
  getLearningSpaces,
  getLearningSpaceById,
  createLearningSpace,
  updateLearningSpace,
  deleteLearningSpace
} from '../controllers/learningSpace.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getLearningSpaces);
router.post('/', createLearningSpace);
router.get('/:id', getLearningSpaceById);
router.put('/:id', updateLearningSpace);
router.delete('/:id', deleteLearningSpace);

export default router;
