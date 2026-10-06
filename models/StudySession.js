import mongoose from "mongoose";

const { Schema } = mongoose;

const studySessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
  date: { type: Date, required: true },
  plannedMinutes: { type: Number, required: true, min: 5, max: 600 },
  actualMinutes: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ["planned", "in_progress", "completed", "skipped"],
    default: "planned",
  },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  // Internal flag: a past unfinished session whose work was already redistributed.
  rescheduled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

studySessionSchema.index({ userId: 1, date: 1 });
studySessionSchema.index({ userId: 1, subjectId: 1 });
studySessionSchema.index({ userId: 1, topicId: 1, status: 1 });

export default mongoose.models.StudySession || mongoose.model("StudySession", studySessionSchema);
