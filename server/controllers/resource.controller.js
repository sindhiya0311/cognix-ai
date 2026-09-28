import Resource from '../models/Resource.js';

export const getResources = async (req, res, next) => {
  try {
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
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    next(error);
  }
};
