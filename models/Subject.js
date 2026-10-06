import mongoose from "mongoose";

const { Schema } = mongoose;

const subjectSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  examDate: { type: Date, required: true },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  color: { type: String, default: "#6366f1" },
  createdAt: { type: Date, default: Date.now },
});

subjectSchema.index({ userId: 1, name: 1 });

export default mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
