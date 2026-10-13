import dbConnect from "./mongodb.js";
import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import StudySession from "../models/StudySession.js";
import { dayKey } from "./utils.js";

function serializeSubject(s) {
  return {
    id: String(s._id),
    name: s.name,
    examDate: dayKey(s.examDate),
    priority: s.priority,
    color: s.color || "#6366f1",
  };
}

function serializeTopic(t) {
  return {
    id: String(t._id),
    subjectId: String(t.subjectId),
    name: t.name,
    difficulty: t.difficulty,
    estimatedMinutes: t.estimatedMinutes || 60,
    importance: t.importance || 5,
    completed: Boolean(t.completed),
  };
}

export function serializeSession(s) {
  return {
    id: String(s._id),
    date: dayKey(s.date),
    subjectId: s.subjectId ? String(s.subjectId._id) : null,
    subjectName: s.subjectId?.name || "Unknown subject",
    subjectColor: s.subjectId?.color || "#6366f1",
    topicId: s.topicId ? String(s.topicId._id) : null,
    topicName: s.topicId?.name || "Unknown topic",
    difficulty: s.topicId?.difficulty || "medium",
    plannedMinutes: s.plannedMinutes || 0,
    actualMinutes: s.actualMinutes || 0,
    status: s.status,
    startedAt: s.startedAt ? s.startedAt.toISOString() : null,
    lastStartedAt: s.lastStartedAt ? s.lastStartedAt.toISOString() : null,
    pausedAt: s.pausedAt ? s.pausedAt.toISOString() : null,
    elapsedActiveSeconds: s.elapsedActiveSeconds || 0,
    timerState: s.timerState || (s.status === "in_progress" ? "running" : "idle"),
    completedAt: s.completedAt ? s.completedAt.toISOString() : null,
  };
}

/** All subjects for a user with topic + progress stats. */
export async function getSubjectsStats(userId) {
  await dbConnect();
  const [subjects, topics, completedSessions] = await Promise.all([
    Subject.find({ userId }).sort({ examDate: 1, name: 1 }).lean(),
    Topic.find({ userId }).lean(),
    StudySession.find({ userId, status: "completed" }).select("subjectId plannedMinutes").lean(),
  ]);

  const topicStats = new Map();
  for (const t of topics) {
    const k = String(t.subjectId);
    const cur = topicStats.get(k) || { topics: 0, completedTopics: 0, totalMinutes: 0 };
    cur.topics += 1;
    if (t.completed) cur.completedTopics += 1;
    cur.totalMinutes += t.estimatedMinutes || 0;
    topicStats.set(k, cur);
  }
  const doneBySubject = new Map();
  for (const s of completedSessions) {
    const k = String(s.subjectId);
    doneBySubject.set(k, (doneBySubject.get(k) || 0) + (s.plannedMinutes || 0));
  }

  return subjects.map((s) => {
    const k = String(s._id);
    const st = topicStats.get(k) || { topics: 0, completedTopics: 0, totalMinutes: 0 };
    const doneMinutes = doneBySubject.get(k) || 0;
    return {
      ...serializeSubject(s),
      topics: st.topics,
      completedTopics: st.completedTopics,
      totalMinutes: st.totalMinutes,
      doneMinutes,
      pendingMinutes: Math.max(0, st.totalMinutes - doneMinutes),
      progress: st.topics > 0 ? Math.round((st.completedTopics / st.topics) * 100) : 0,
    };
  });
}

/** One subject + its topics + stats, or null. */
export async function getSubjectDetail(userId, subjectId) {
  await dbConnect();
  const subject = await Subject.findOne({ _id: subjectId, userId }).lean();
  if (!subject) return null;
  const topics = await Topic.find({ userId, subjectId }).sort({ createdAt: 1 }).lean();
  const stats = (await getSubjectsStats(userId)).find((s) => s.id === String(subjectId));
  return {
    subject: serializeSubject(subject),
    topics: topics.map(serializeTopic),
    stats: stats || null,
  };
}

/** All topics of a user. */
export async function getUserTopics(userId) {
  await dbConnect();
  const topics = await Topic.find({ userId }).sort({ createdAt: 1 }).lean();
  return topics.map(serializeTopic);
}

/** Sessions joined with subject/topic details. Date filter keys are "YYYY-MM-DD". */
export async function getSessionsDetailed(userId, { from, to, subjectId } = {}) {
  await dbConnect();
  const query = { userId };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(`${from}T00:00:00.000Z`);
    if (to) query.date.$lte = new Date(`${to}T23:59:59.999Z`);
  }
  if (subjectId) query.subjectId = subjectId;

  const sessions = await StudySession.find(query)
    .sort({ date: 1, createdAt: 1 })
    .limit(1000)
    .populate({ path: "subjectId", select: "name color" })
    .populate({ path: "topicId", select: "name difficulty" })
    .lean();

  return sessions.map(serializeSession);
}
