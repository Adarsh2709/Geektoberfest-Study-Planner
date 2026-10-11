import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  preferences: {
    dailyStudyMinutes: { type: Number, default: 120, min: 0, max: 1440 },
    preferredStudyTime: { type: String, enum: ["morning", "afternoon", "evening", "night"], default: "evening" },
    weeklyAvailability: { type: Schema.Types.Mixed, default: {} },
    timeZone: { type: String, default: "UTC", trim: true },
  },
  onboarded: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", userSchema);
