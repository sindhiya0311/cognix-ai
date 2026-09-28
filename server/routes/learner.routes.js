import express from 'express';
import { getLearnerProfile, getLearnerDNA } from '../controllers/learner.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/spaces/:spaceId/learner', getLearnerProfile);
router.get('/spaces/:spaceId/learner/dna', getLearnerDNA);

export default router;
