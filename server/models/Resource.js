import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  learningSpaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningSpace', required: true },
  worldId: { type: String, default: null },
  name: { type: String, required: true },
  type: { type: String, default: 'text' },
  text: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Resource', resourceSchema);
