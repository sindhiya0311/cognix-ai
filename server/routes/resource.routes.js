import express from 'express';
import { getResources, createResource, deleteResource } from '../controllers/resource.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/spaces/:spaceId/resources', getResources);
router.post('/spaces/:spaceId/resources', createResource);
router.delete('/resources/:id', deleteResource);

export default router;
