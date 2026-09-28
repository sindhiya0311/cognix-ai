import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  objective: { type: String, default: '' },
  skills: [{ type: String }]
}, { _id: false });

const unitSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  topics: [topicSchema]
}, { _id: false });

const syllabusSchema = new mongoose.Schema({
  learningSpaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningSpace', required: true },
  title: { type: String, default: 'Untitled Syllabus' },
  subject: { type: String, default: 'General' },
  type: { type: String, default: 'demo' },
  units: [unitSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Syllabus', syllabusSchema);
