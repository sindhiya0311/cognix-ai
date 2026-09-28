import World from '../models/World.js';
import LearningSpace from '../models/LearningSpace.js';
import { checkProgression } from '../services/progression.service.js';

export const getWorldsBySpace = async (req, res, next) => {
  try {
    const space = await LearningSpace.findById(req.params.spaceId);
    if (!space || (space.userId && space.userId.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access worlds for this space' });
    }
    const rawWorlds = await World.find({ learningSpaceId: req.params.spaceId }).sort({ order: 1 });
    const worlds = checkProgression(rawWorlds.map(w => w.toObject()));
    res.json({ success: true, data: worlds });
  } catch (error) {
    next(error);
  }
};

export const getWorldById = async (req, res, next) => {
  try {
    const world = await World.findById(req.params.id).populate('learningSpaceId');
    if (!world) return res.status(404).json({ success: false, message: 'World not found' });
    if (world.learningSpaceId && world.learningSpaceId.userId && world.learningSpaceId.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this world' });
    }
    res.json({ success: true, data: world });
  } catch (error) {
    next(error);
  }
};

export const unlockWorld = async (req, res, next) => {
  try {
    const world = await World.findById(req.params.id).populate('learningSpaceId');
    if (!world) return res.status(404).json({ success: false, message: 'World not found' });
    if (world.learningSpaceId && world.learningSpaceId.userId && world.learningSpaceId.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this world' });
    }

    // Server-side prerequisite enforcement
    if (world.order > 0) {
      const allWorlds = await World.find({ learningSpaceId: world.learningSpaceId._id || world.learningSpaceId }).sort({ order: 1 });
      const previousWorld = allWorlds.find(w => w.order === world.order - 1);
      if (previousWorld && (previousWorld.mastery || 0) < 0.72) {
        return res.status(403).json({
          success: false,
          message: `Cannot unlock "${world.name}" — previous world "${previousWorld.name}" must be mastered first (current: ${Math.round((previousWorld.mastery || 0) * 100)}%, required: 72%)`
        });
      }
    }

    world.unlocked = true;
    world.status = world.mastery >= 0.72 ? 'MASTERED' : 'OPEN';
    await world.save();

    res.json({ success: true, data: world, message: `World ${world.name} unlocked` });
  } catch (error) {
    next(error);
  }
};

