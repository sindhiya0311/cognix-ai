import LearningSpace from '../models/LearningSpace.js';
import World from '../models/World.js';
import Syllabus from '../models/Syllabus.js';
import LearnerProfile from '../models/LearnerProfile.js';
import Resource from '../models/Resource.js';
import { DEMO_SYLLABUS } from '../../src/data/v2data.js';
import { generateWorldsFromSyllabus } from '../services/worldGeneration.service.js';
import { parseSyllabusHeuristic } from '../services/syllabusAI.service.js';

export const getLearningSpaces = async (req, res, next) => {
  try {
    const spaces = await LearningSpace.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const populated = await Promise.all(spaces.map(async (space) => {
      const worlds = await World.find({ learningSpaceId: space._id }).sort({ order: 1 });
      const syllabus = await Syllabus.findOne({ learningSpaceId: space._id });
      const learnerProfile = await LearnerProfile.findOne({ learningSpaceId: space._id });
      const notes = await Resource.find({ learningSpaceId: space._id }).sort({ createdAt: -1 });
      return {
        ...space.toObject(),
        worlds: worlds || [],
        syllabus: syllabus || null,
        learner: learnerProfile || { mastery: 0, accuracy: 0, avgTime: 0, attempts: 0, errors: 0, hints: 0, preferredGame: 'quiz', struggleRisk: 'LOW', misconceptions: [] },
        notes: notes || []
      };
    }));
    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const getLearningSpaceById = async (req, res, next) => {
  try {
    const space = await LearningSpace.findById(req.params.id);
    if (!space) {
      return res.status(404).json({ success: false, message: 'Learning Space not found' });
    }

    if (space.userId && space.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this learning space' });
    }

    const worlds = await World.find({ learningSpaceId: space._id }).sort({ order: 1 });
    const syllabus = await Syllabus.findOne({ learningSpaceId: space._id });
    const learnerProfile = await LearnerProfile.findOne({ learningSpaceId: space._id });
    const notes = await Resource.find({ learningSpaceId: space._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...space.toObject(),
        worlds,
        syllabus,
        learner: learnerProfile,
        notes
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createLearningSpace = async (req, res, next) => {
  try {
    const { name, subject, description } = req.body;
    const spaceName = name || 'New Learning Space';

    const space = await LearningSpace.create({
      userId: req.user.id,
      name: spaceName,
      subject: subject || spaceName,
      description: description || ''
    });

    let structuredSyllabus;

    if (spaceName.toLowerCase() === 'programming' && (!subject || subject.toLowerCase() === 'programming')) {
      structuredSyllabus = DEMO_SYLLABUS;
    } else {
      structuredSyllabus = parseSyllabusHeuristic('', spaceName);
    }

    const syllabus = await Syllabus.create({
      learningSpaceId: space._id,
      title: `${space.name} Syllabus`,
      subject: space.subject,
      units: structuredSyllabus.units,
      createdBy: req.user.id,
      type: (spaceName.toLowerCase() === 'programming') ? 'demo' : 'custom'
    });

    const defaultWorlds = generateWorldsFromSyllabus(structuredSyllabus, space._id);
    const worldDocs = await World.insertMany(defaultWorlds);

    const learnerProfile = await LearnerProfile.create({
      userId: req.user.id,
      learningSpaceId: space._id,
      mastery: 0,
      accuracy: 0,
      avgTime: 0,
      attempts: 0,
      errors: 0,
      hints: 0,
      preferredGame: 'quiz',
      struggleRisk: 'LOW',
      misconceptions: []
    });

    space.syllabusId = syllabus._id;
    space.learnerProfileId = learnerProfile._id;
    await space.save();

    res.status(201).json({
      success: true,
      data: {
        ...space.toObject(),
        worlds: worldDocs,
        syllabus,
        learner: learnerProfile,
        notes: []
      },
      message: `Learning space ${space.name} created successfully`
    });
  } catch (error) {
    next(error);
  }
};

export const updateLearningSpace = async (req, res, next) => {
  try {
    const space = await LearningSpace.findById(req.params.id);
    if (!space) return res.status(404).json({ success: false, message: 'Learning space not found' });
    if (space.userId && space.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this learning space' });
    }
    const updatedSpace = await LearningSpace.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updatedSpace });
  } catch (error) {
    next(error);
  }
};

export const deleteLearningSpace = async (req, res, next) => {
  try {
    const space = await LearningSpace.findById(req.params.id);
    if (!space) return res.status(404).json({ success: false, message: 'Learning space not found' });
    if (space.userId && space.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this learning space' });
    }

    await LearningSpace.findByIdAndDelete(req.params.id);

    await World.deleteMany({ learningSpaceId: req.params.id });
    await Syllabus.deleteMany({ learningSpaceId: req.params.id });
    await LearnerProfile.deleteMany({ learningSpaceId: req.params.id });
    await Resource.deleteMany({ learningSpaceId: req.params.id });

    res.json({ success: true, message: 'Learning space and associated data deleted' });
  } catch (error) {
    next(error);
  }
};
