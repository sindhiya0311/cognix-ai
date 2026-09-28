import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import LearningSpace from '../models/LearningSpace.js';
import Syllabus from '../models/Syllabus.js';
import World from '../models/World.js';
import LearnerProfile from '../models/LearnerProfile.js';
import { DEMO_SYLLABUS, makeWorlds } from '../../src/data/v2data.js';

dotenv.config();

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamelearn';
    console.log(`[Seed] Connecting to MongoDB: ${uri}`);
    await mongoose.connect(uri);

    console.log('[Seed] Clearing existing demo data...');
    await User.deleteMany({ email: 'demo@gamelearn.ai' });
    
    // Create demo user
    const demoUser = await User.create({
      name: 'Demo Learner',
      email: 'demo@gamelearn.ai',
      passwordHash: 'demopassword123'
    });

    console.log('[Seed] Creating demo Learning Space...');
    const space = await LearningSpace.create({
      userId: demoUser._id,
      name: 'Programming',
      subject: 'Programming',
      description: 'Programming Foundations, Control Flow, and Functions'
    });

    const syllabus = await Syllabus.create({
      learningSpaceId: space._id,
      title: 'Programming Demo Syllabus',
      subject: 'Programming',
      units: DEMO_SYLLABUS.units,
      createdBy: demoUser._id,
      type: 'demo'
    });

    const defaultWorlds = makeWorlds(DEMO_SYLLABUS.units);
    const worldDocs = await World.insertMany(
      defaultWorlds.map(w => ({
        ...w,
        learningSpaceId: space._id,
        topicId: w.id
      }))
    );

    const profile = await LearnerProfile.create({
      userId: demoUser._id,
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
    space.learnerProfileId = profile._id;
    await space.save();

    console.log('[Seed] Database seeded successfully!');
    console.log(`Demo User: ${demoUser.email}`);
    console.log(`Learning Space ID: ${space._id}`);
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seed();
