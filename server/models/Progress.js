import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  learningSpaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningSpace', required: true, unique: true },
  overallMastery: { type: Number, default: 0 },
  totalXP: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  history: [{ type: mongoose.Schema.Types.Mixed }]
}, { timestamps: true });

export default mongoose.model('Progress', progressSchema);
