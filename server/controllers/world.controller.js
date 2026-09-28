import World from '../models/World.js';
import { checkProgression } from '../services/progression.service.js';

export const getWorldsBySpace = async (req, res, next) => {
  try {
    const rawWorlds = await World.find({ learningSpaceId: req.params.spaceId }).sort({ order: 1 });
    const worlds = checkProgression(rawWorlds.map(w => w.toObject()));
    res.json({ success: true, data: worlds });
  } catch (error) {
    next(error);
  }
};

export const getWorldById = async (req, res, next) => {
  try {
    const world = await World.findById(req.params.id);
    if (!world) return res.status(404).json({ success: false, message: 'World not found' });
    res.json({ success: true, data: world });
  } catch (error) {
    next(error);
  }
};

export const unlockWorld = async (req, res, next) => {
  try {
    const world = await World.findById(req.params.id);
    if (!world) return res.status(404).json({ success: false, message: 'World not found' });

    world.unlocked = true;
    world.status = world.mastery >= 0.72 ? 'MASTERED' : 'OPEN';
    await world.save();

    res.json({ success: true, data: world, message: `World ${world.name} unlocked` });
  } catch (error) {
    next(error);
  }
};
