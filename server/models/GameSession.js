import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  learningSpaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningSpace', required: true },
  worldId: { type: String, required: true },
  gameType: { type: String, required: true },
  difficulty: { type: Number, default: 1 },
  modality: { type: String, default: 'quiz' },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'ABORTED'], default: 'ACTIVE' },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  result: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

export default mongoose.model('GameSession', gameSessionSchema);
