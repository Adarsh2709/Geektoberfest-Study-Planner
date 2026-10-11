import mongoose from "mongoose";
import dbConnect from "./mongodb.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import StudySession from "../models/StudySession.js";
import { serializeSession } from "./queries.js";
import { addDays, dayKey, daysBetween, parseDayKey, startOfWeek } from "./utils.js";

// Ranges up to this many days are charted per day, longer ones per week.
const DAILY_TREND_MAX_DAYS = 62;

function bucketDaily(days, from, to) {
  const byDay = new Map(days.map((d) => [d._id, d]));
  const out = [];
  for (let d = parseDayKey(from); d <= parseDayKey(to); d = addDays(d, 1)) {
    const key = dayKey(d);
    const row = byDay.get(key);
    out.push({
      label: key,
      planned: row?.planned || 0,
      actual: row?.actual || 0,
      completed: row?.completed || 0,
      skipped: row?.skipped || 0,
    });
  }
  return out;
}

function bucketWeekly(days, from, to) {
  const byWeek = new Map();
  for (const d of days) {
    const key = dayKey(startOfWeek(parseDayKey(d._id)));
    const cur = byWeek.get(key) || { label: key, planned: 0, actual: 0, completed: 0, skipped: 0 };
    cur.planned += d.planned;
    cur.actual += d.actual;
    cur.completed += d.completed;
    cur.skipped += d.skipped;
    byWeek.set(key, cur);
  }
  const out = [];
  const end = startOfWeek(parseDayKey(to));
  for (let w = startOfWeek(parseDayKey(from)); w <= end; w = addDays(w, 7)) {
    const key = dayKey(w);
    const row = byWeek.get(key);
    out.push({
      label: key,
      planned: row?.planned || 0,
      actual: row?.actual || 0,
      completed: row?.completed || 0,
      skipped: row?.skipped || 0,
    });
  }
  return out;
}

/**
 * Study history for one user. `filters` must already be validated by historyQuerySchema.
 * Returns null when the requested subject/topic does not belong to the user.
 * Every query is scoped by userId, so one user can never see another's sessions.
 */
export async function getStudyHistory(userId, { from, to, subjectId, topicId, status, page, limit }) {
  await dbConnect();

  if (subjectId && !(await Subject.exists({ _id: subjectId, userId }))) return null;
  if (topicId) {
    const topic = await Topic.findOne({ _id: topicId, userId }).select("subjectId").lean();
    if (!topic || (subjectId && String(topic.subjectId) !== String(subjectId))) return null;
  }

  const match = {
    userId: new mongoose.Types.ObjectId(String(userId)),
    date: { $gte: parseDayKey(from), $lte: parseDayKey(to) },
  };
  if (subjectId) match.subjectId = new mongoose.Types.ObjectId(subjectId);
  if (topicId) match.topicId = new mongoose.Types.ObjectId(topicId);
  if (status) match.status = status;

  const countIf = (s) => ({ $sum: { $cond: [{ $eq: ["$status", s] }, 1, 0] } });
  const [days, sessions] = await Promise.all([
    StudySession.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } },
          planned: { $sum: "$plannedMinutes" },
          // Same definition as the Progress page: actual minutes of every matching session.
          actual: { $sum: "$actualMinutes" },
          completed: countIf("completed"),
          skipped: countIf("skipped"),
          inProgress: countIf("in_progress"),
          sessions: { $sum: 1 },
        },
      },
    ]),
    StudySession.find(match)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "subjectId", select: "name color" })
      .populate({ path: "topicId", select: "name difficulty" })
      .lean(),
  ]);

  const summary = { plannedMinutes: 0, actualMinutes: 0, completedCount: 0, skippedCount: 0, inProgressCount: 0, totalSessions: 0 };
  for (const d of days) {
    summary.plannedMinutes += d.planned;
    summary.actualMinutes += d.actual;
    summary.completedCount += d.completed;
    summary.skippedCount += d.skipped;
    summary.inProgressCount += d.inProgress;
    summary.totalSessions += d.sessions;
  }

  const daily = daysBetween(parseDayKey(from), parseDayKey(to)) + 1 <= DAILY_TREND_MAX_DAYS;
  return {
    range: { from, to },
    summary,
    trend: { granularity: daily ? "day" : "week", points: daily ? bucketDaily(days, from, to) : bucketWeekly(days, from, to) },
    sessions: sessions.map(serializeSession),
    pagination: {
      page,
      limit,
      total: summary.totalSessions,
      totalPages: Math.max(1, Math.ceil(summary.totalSessions / limit)),
    },
  };
}
