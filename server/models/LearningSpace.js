import mongoose from 'mongoose';

const learningSpaceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  subject: { type: String, default: 'General' },
  syllabusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Syllabus' },
  learnerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearnerProfile' },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  gamesCompleted: { type: Number, default: 0 },
  lastAction: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

export default mongoose.model('LearningSpace', learningSpaceSchema);
