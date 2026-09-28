import LearnerProfile from '../models/LearnerProfile.js';
import World from '../models/World.js';
import LearningSpace from '../models/LearningSpace.js';
import { calculateLearnerDNA } from '../services/learnerDNA.service.js';

export const getLearnerProfile = async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    const space = await LearningSpace.findById(spaceId);
    if (!space || (space.userId && space.userId.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access learner profile for this space' });
    }
    let profile = await LearnerProfile.findOne({ learningSpaceId: spaceId });
    if (!profile) {
      const worlds = await World.find({ learningSpaceId: spaceId });
      const dna = calculateLearnerDNA(worlds);
      profile = await LearnerProfile.create({
        userId: req.user.id,
        learningSpaceId: spaceId,
        ...dna
      });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getLearnerDNA = async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    const space = await LearningSpace.findById(spaceId);
    if (!space || (space.userId && space.userId.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access learner DNA for this space' });
    }
    const worlds = await World.find({ learningSpaceId: spaceId });
    const dna = calculateLearnerDNA(worlds);

    res.json({
      success: true,
      data: {
        ...dna,
        xp: space?.xp || 0,
        level: space?.level || 1,
        streak: space?.streak || 0,
        gamesCompleted: space?.gamesCompleted || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
