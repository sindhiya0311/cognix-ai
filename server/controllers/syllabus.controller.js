import Syllabus from '../models/Syllabus.js';
import World from '../models/World.js';
import LearningSpace from '../models/LearningSpace.js';
import { analyzeSyllabusAI, extractTextFromBuffer } from '../services/syllabusAI.service.js';
import { generateWorldsFromSyllabus } from '../services/worldGeneration.service.js';

export const saveSyllabus = async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    const { title, units, rawText } = req.body;

    const space = await LearningSpace.findById(spaceId);
    if (!space) return res.status(404).json({ success: false, message: 'Learning Space not found' });
    if (space.userId && space.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this syllabus' });
    }

    let structuredSyllabus;

    if (units && Array.isArray(units) && units.length > 0) {
      structuredSyllabus = { subject: space.name, units };
    } else if (rawText) {
      structuredSyllabus = await analyzeSyllabusAI(rawText, space.name);
    } else {
      return res.status(400).json({ success: false, message: 'Please provide units or raw syllabus text' });
    }

    let syllabus = await Syllabus.findOne({ learningSpaceId: spaceId });
    if (syllabus) {
      syllabus.title = title || `${space.name} Syllabus`;
      syllabus.subject = space.name;
      syllabus.units = structuredSyllabus.units;
      syllabus.type = 'custom';
      await syllabus.save();
    } else {
      syllabus = await Syllabus.create({
        learningSpaceId: spaceId,
        title: title || `${space.name} Syllabus`,
        subject: space.name,
        units: structuredSyllabus.units,
        type: 'custom',
        createdBy: req.user.id
      });
    }

    // Generate new worlds FROM THE CUSTOM SYLLABUS ONLY!
    await World.deleteMany({ learningSpaceId: spaceId });
    const generatedWorlds = generateWorldsFromSyllabus(structuredSyllabus, spaceId);
    const worldDocs = await World.insertMany(generatedWorlds);

    await LearningSpace.findByIdAndUpdate(spaceId, { syllabusId: syllabus._id });

    res.json({
      success: true,
      data: {
        syllabus,
        worlds: worldDocs,
        worldCount: worldDocs.length
      },
      message: `Syllabus parsed cleanly into ${worldDocs.length} custom worlds`
    });
  } catch (error) {
    next(error);
  }
};

export const parseSyllabusFile = async (req, res, next) => {
  try {
    const { spaceId } = req.params;
    const space = await LearningSpace.findById(spaceId);
    if (!space) return res.status(404).json({ success: false, message: 'Learning Space not found' });
    if (space.userId && space.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this space' });
    }
    const spaceName = space.name;

    let text = req.body.rawText || '';

    if (req.file) {
      text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
    }

    const structured = await analyzeSyllabusAI(text, spaceName);
    res.json({ success: true, data: structured });
  } catch (error) {
    next(error);
  }
};

export const getSyllabus = async (req, res, next) => {
  try {
    const space = await LearningSpace.findById(req.params.spaceId);
    if (!space || (space.userId && space.userId.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this syllabus' });
    }
    const syllabus = await Syllabus.findOne({ learningSpaceId: req.params.spaceId });
    if (!syllabus) return res.status(404).json({ success: false, message: 'Syllabus not found' });
    res.json({ success: true, data: syllabus });
  } catch (error) {
    next(error);
  }
};
