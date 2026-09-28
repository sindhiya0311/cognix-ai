import mongoose from 'mongoose';

const learnerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  learningSpaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningSpace', required: true, unique: true },
  mastery: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  avgTime: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  errors: { type: Number, default: 0 },
  hints: { type: Number, default: 0 },
  preferredGame: { type: String, default: 'quiz' },
  struggleRisk: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  misconceptions: [{ type: String }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  currentWorldId: { type: String, default: null }
}, { timestamps: true });

export default mongoose.model('LearnerProfile', learnerProfileSchema);
