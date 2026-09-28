import mongoose from 'mongoose';

const historyAttemptSchema = new mongoose.Schema({
  id: { type: String },
  game: { type: String, required: true },
  correct: { type: Boolean, required: true },
  confidence: { type: Number, default: 0.8 },
  seconds: { type: Number, default: 5 },
  difficulty: { type: Number, default: 1 },
  hintUsed: { type: Boolean, default: false },
  timestamp: { type: Number, default: Date.now }
}, { _id: false });

const worldSchema = new mongoose.Schema({
  learningSpaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningSpace', required: true },
  unitId: { type: String, required: true },
  unitName: { type: String, required: true },
  topicId: { type: String, required: true },
  name: { type: String, required: true },
  objective: { type: String, default: '' },
  skills: [{ type: String }],
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['LOCKED', 'OPEN', 'MASTERED'], default: 'LOCKED' },
  mastery: { type: Number, default: 0 },
  requiredMastery: { type: Number, default: 0.72 },
  difficulty: { type: Number, default: 1 },
  unlocked: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  games: [{ type: String }],
  completedGames: [{ type: String }],
  history: [historyAttemptSchema],
  bossComplete: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('World', worldSchema);
