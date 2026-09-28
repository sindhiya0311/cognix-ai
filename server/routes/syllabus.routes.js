import express from 'express';
import { saveSyllabus, getSyllabus } from '../controllers/syllabus.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/spaces/:spaceId/syllabus', saveSyllabus);
router.put('/spaces/:spaceId/syllabus', saveSyllabus);
router.get('/spaces/:spaceId/syllabus', getSyllabus);

export default router;
