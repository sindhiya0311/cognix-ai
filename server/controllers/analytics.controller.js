import World from '../models/World.js';
import GameAttempt from '../models/GameAttempt.js';
import LearningSpace from '../models/LearningSpace.js';

export const getAnalyticsBySpace = async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    const space = await LearningSpace.findById(spaceId);
    if (!space || (space.userId && space.userId.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view analytics for this space' });
    }
    const worlds = await World.find({ learningSpaceId: spaceId });
    const attempts = await GameAttempt.find({ learningSpaceId: spaceId });

    const gameStats = {};

    attempts.forEach(h => {
      if (!gameStats[h.gameType]) {
        gameStats[h.gameType] = { n: 0, c: 0, avgTime: 0, totalTime: 0 };
      }
      gameStats[h.gameType].n += 1;
      if (h.correct) gameStats[h.gameType].c += 1;
      gameStats[h.gameType].totalTime += h.responseTime || 0;
      gameStats[h.gameType].avgTime = gameStats[h.gameType].totalTime / gameStats[h.gameType].n;
    });

    res.json({
      success: true,
      data: {
        gameStats,
        worldMastery: worlds.map(w => ({
          id: w._id,
          topicId: w.topicId,
          name: w.name,
          mastery: w.mastery,
          historyCount: w.history?.length || 0
        })),
        totalAttempts: attempts.length
      }
    });
  } catch (error) {
    next(error);
  }
};
