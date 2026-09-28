import Resource from '../models/Resource.js';
import LearningSpace from '../models/LearningSpace.js';

export const getResources = async (req, res, next) => {
  try {
    const space = await LearningSpace.findById(req.params.spaceId);
    if (!space || (space.userId && space.userId.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access resources for this space' });
    }
    const resources = await Resource.find({ learningSpaceId: req.params.spaceId });
    res.json({ success: true, data: resources });
  } catch (error) {
    next(error);
  }
};

export const createResource = async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    const { name, type, text, worldId } = req.body;

    const space = await LearningSpace.findById(spaceId);
    if (!space || (space.userId && space.userId.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to create resources in this space' });
    }

    const resource = await Resource.create({
      learningSpaceId: spaceId,
      worldId: worldId || null,
      name: name || 'Note',
      type: type || 'text',
      text: text || ''
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
};

export const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    const space = await LearningSpace.findById(resource.learningSpaceId);
    if (space && space.userId && space.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this resource' });
    }
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    next(error);
  }
};
