import dbConnect from "./mongodb.js";
import User from "../models/User.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import StudySession from "../models/StudySession.js";
import { allocateSessions, buildTopicQueue, getAvailabilityMinutes } from "./planner.js";
import { dayKey, startOfDay } from "./utils.js";

/**
 * Rebuilds the user's plan deterministically.
 *
 * 1. Past unfinished sessions (planned/in_progress/skipped-not-yet-rescheduled)
 *    are marked "skipped" + rescheduled (history preserved, never deleted).
 * 2. Future planned sessions are removed — their work returns to the pending pool.
 * 3. Pending minutes per topic = estimated - completed - actively-in-progress.
 * 4. Pending work is re-allocated into future free capacity (never over daily
 *    availability, never after exam dates, completed work untouched).
 *
 * Used by: plan generation (onboarding), manual "Recalculate Plan",
 * and automatic replanning when the student falls behind.
 */
export async function rebuildPlan(userId, { markOnboarded = false } = {}) {
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const [subjects, topics, sessions] = await Promise.all([
    Subject.find({ userId }).lean(),
    Topic.find({ userId }).lean(),
    StudySession.find({ userId }).lean(),
  ]);
  const today = startOfDay(new Date());

  const doneByTopic = {};
  const activeByTopic = {};
  const existingLoadByDay = {};
  const toMarkMissed = [];
  let missedMinutes = 0;

  for (const s of sessions) {
    const topicKey = String(s.topicId);
    const inPast = s.date < today;

    if (inPast && (s.status === "planned" || s.status === "in_progress")) {
      missedMinutes += s.plannedMinutes || 0;
      toMarkMissed.push(String(s._id));
      continue;
    }
    if (inPast && s.status === "skipped" && !s.rescheduled) {
      missedMinutes += s.plannedMinutes || 0;
      toMarkMissed.push(String(s._id));
      continue;
    }
    if (s.status === "planned" || s.status === "skipped") continue; // future -> work returns to pool
    if (s.status === "completed") {
      doneByTopic[topicKey] = (doneByTopic[topicKey] || 0) + (s.plannedMinutes || 0);
      continue;
    }
    if (s.status === "in_progress") {
      activeByTopic[topicKey] = (activeByTopic[topicKey] || 0) + (s.plannedMinutes || 0);
      const key = dayKey(s.date);
      existingLoadByDay[key] = (existingLoadByDay[key] || 0) + (s.plannedMinutes || 0);
    }
  }

  if (toMarkMissed.length) {
    await StudySession.updateMany(
      { _id: { $in: toMarkMissed } },
      { $set: { status: "skipped", rescheduled: true } }
    );
  }
  await StudySession.deleteMany({ userId, status: "planned", date: { $gte: today } });

  const items = buildTopicQueue({ topics, subjects, today, doneByTopic, activeByTopic });
  const { scheduled, dropped } = allocateSessions({
    items,
    availabilityFor: (day) => getAvailabilityMinutes(user, day),
    startDate: today,
    existingLoadByDay,
  });

  if (scheduled.length) {
    await StudySession.insertMany(
      scheduled.map((item) => ({
        userId,
        subjectId: item.subjectId,
        topicId: item.topicId,
        date: item.date,
        plannedMinutes: item.minutes,
        actualMinutes: 0,
        status: "planned",
      }))
    );
  }

  if (markOnboarded && !user.onboarded) {
    user.onboarded = true;
    await user.save();
  }

  return {
    adjusted: missedMinutes > 0,
    missedMinutes,
    daysAffected: new Set(scheduled.map((s) => dayKey(s.date))).size,
    sessionsCreated: scheduled.length,
    unscheduled: dropped.length,
  };
}

/** Runs on dashboard loads: only rebuilds when the student actually fell behind. */
export async function autoReplanIfNeeded(userId) {
  await dbConnect();
  const today = startOfDay(new Date());
  const unfinishedPast = await StudySession.countDocuments({
    userId,
    date: { $lt: today },
    status: { $in: ["planned", "in_progress"] },
  });
  const skippedPast = await StudySession.countDocuments({
    userId,
    date: { $lt: today },
    status: "skipped",
    rescheduled: { $ne: true },
  });
  if (unfinishedPast + skippedPast === 0) {
    return { adjusted: false, missedMinutes: 0, daysAffected: 0, sessionsCreated: 0, unscheduled: 0 };
  }
  try {
    return await rebuildPlan(userId);
  } catch (err) {
    console.error("Auto-replan failed:", err);
    return { adjusted: false, missedMinutes: 0, daysAffected: 0, sessionsCreated: 0, unscheduled: 0 };
  }
}
