import GameSession from '../models/GameSession.js';
import GameAttempt from '../models/GameAttempt.js';
import World from '../models/World.js';
import LearningSpace from '../models/LearningSpace.js';
import LearnerProfile from '../models/LearnerProfile.js';
import { decideNextActivity, applyGameResult } from '../services/adaptive.service.js';
import { calculateLearnerDNA } from '../services/learnerDNA.service.js';
import { generateGameContentAI } from '../services/aiGameContent.service.js';

export const startGameSession = async (req, res, next) => {
  try {
    const { worldId } = req.params;
    const { requestedGame } = req.body;

    const world = await World.findOne({ topicId: worldId }) || await World.findById(worldId);
    if (!world) return res.status(404).json({ success: false, message: 'World not found' });

    const space = await LearningSpace.findById(world.learningSpaceId);
    const decision = decideNextActivity(space, world);
    const activeGameType = requestedGame || decision.game;

    // Generate dynamic AI challenge content tailored to this topic
    const challenge = await generateGameContentAI(world, activeGameType, decision.difficulty);

    const session = await GameSession.create({
      userId: req.user.id,
      learningSpaceId: space._id,
      worldId: world.topicId || world._id,
      gameType: activeGameType,
      difficulty: decision.difficulty,
      modality: decision.mode,
      status: 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      data: {
        session,
        decision,
        recommendedGame: activeGameType,
        challenge
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getGameChallenge = async (req, res, next) => {
  try {
    const { worldId } = req.params;
    const { gameType, difficulty } = req.query;

    const world = await World.findOne({ topicId: worldId }) || await World.findById(worldId);
    if (!world) return res.status(404).json({ success: false, message: 'World not found' });

    const challenge = await generateGameContentAI(world, gameType || 'quiz', Number(difficulty) || 1);
    res.json({ success: true, data: challenge });
  } catch (error) {
    next(error);
  }
};

export const submitGameAttempt = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = req.body;

    let session;
    if (sessionId && sessionId !== 'direct') {
      session = await GameSession.findById(sessionId);
    }

    const spaceId = session ? session.learningSpaceId : result.spaceId;
    const targetWorldId = session ? session.worldId : result.worldId;

    let world = await World.findOne({ topicId: targetWorldId, learningSpaceId: spaceId }) || await World.findById(targetWorldId);
    let space = await LearningSpace.findById(spaceId);

    if (!world || !space) {
      return res.status(404).json({ success: false, message: 'Space or World context not found' });
    }

    const previousMastery = world.mastery || 0;

    applyGameResult(world, result);
    await world.save();

    await GameAttempt.create({
      userId: req.user.id,
      learningSpaceId: space._id,
      worldId: world.topicId || world._id,
      gameType: result.game,
      correct: result.correct,
      score: result.correct ? Math.round(20 * (result.difficulty || 1)) : 5,
      responseTime: result.seconds || 5,
      hintsUsed: result.hintUsed || false,
      difficulty: result.difficulty || 1
    });

    if (session) {
      session.status = 'COMPLETED';
      session.completedAt = new Date();
      session.result = result;
      await session.save();
    }

    space.gamesCompleted = (space.gamesCompleted || 0) + 1;
    space.xp += result.correct ? Math.round(20 * (result.difficulty || 1)) : 5;
    space.level = Math.floor(space.xp / 150) + 1;
    if (result.correct) space.streak = (space.streak || 0) + 1;
    else space.streak = 0;

    const allWorlds = await World.find({ learningSpaceId: space._id });
    const dna = calculateLearnerDNA(allWorlds);

    await LearnerProfile.findOneAndUpdate(
      { learningSpaceId: space._id },
      { ...dna, userId: req.user.id },
      { upsert: true, new: true }
    );

    const nextDecision = decideNextActivity(space, world);

    space.lastAction = {
      world: world.name,
      game: result.game,
      correct: result.correct,
      fromMastery: previousMastery,
      toMastery: world.mastery,
      decision: nextDecision
    };

    await space.save();

    res.json({
      success: true,
      data: {
        world,
        space,
        learnerDNA: dna,
        nextDecision
      },
      message: result.correct ? 'Mastery updated cleanly' : 'Recovery activity recorded'
    });
  } catch (error) {
    next(error);
  }
};
