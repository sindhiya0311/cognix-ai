import mongoose from 'mongoose';

const gameAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  learningSpaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningSpace', required: true },
  worldId: { type: String, required: true },
  gameType: { type: String, required: true },
  correct: { type: Boolean, required: true },
  score: { type: Number, default: 0 },
  responseTime: { type: Number, default: 0 },
  hintsUsed: { type: Boolean, default: false },
  selectedAnswer: { type: mongoose.Schema.Types.Mixed },
  expectedAnswer: { type: mongoose.Schema.Types.Mixed },
  misconception: { type: String, default: null },
  difficulty: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('GameAttempt', gameAttemptSchema);
