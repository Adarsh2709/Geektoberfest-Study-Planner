import mongoose from "mongoose";

const { Schema } = mongoose;

const topicSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  estimatedMinutes: { type: Number, default: 60, min: 5, max: 600 },
  importance: { type: Number, default: 5, min: 1, max: 10 },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

topicSchema.index({ userId: 1, subjectId: 1 });

export default mongoose.models.Topic || mongoose.model("Topic", topicSchema);
