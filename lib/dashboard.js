import dbConnect from "./mongodb.js";
import User from "../models/User.js";
import StudySession from "../models/StudySession.js";
import { getSubjectsStats, getSessionsDetailed } from "./queries.js";
import { autoReplanIfNeeded } from "./replanner.js";
import { getAvailabilityMinutes } from "./planner.js";
import {
  WEEKDAY_SHORT,
  addDays,
  dayKey,
  daysBetween,
  formatMinutes,
  formatShortDate,
  startOfDay,
  startOfToday,
  startOfWeek,
  todayKey,
  weekdayOfKey,
} from "./utils.js";

function computeStreak(completedDayKeys, today) {
  let d = today;
  if (!completedDayKeys.has(dayKey(d))) d = addDays(d, -1); // streak may end yesterday
  let streak = 0;
  while (completedDayKeys.has(dayKey(d))) {
    streak += 1;
    d = addDays(d, -1);
  }
  return streak;
}

function overallStats(allSessions, today) {
  let totalStudyMinutes = 0;
  let completedCount = 0;
  let skippedCount = 0;
  let inProgressCount = 0;
  const completedDaySet = new Set();
  for (const s of allSessions) {
    totalStudyMinutes += s.actualMinutes || 0;
    if (s.status === "completed") {
      completedCount += 1;
      completedDaySet.add(dayKey(s.date));
    } else if (s.status === "skipped") skippedCount += 1;
    else if (s.status === "in_progress") inProgressCount += 1;
  }
  const resolved = completedCount + skippedCount + inProgressCount;
  return {
    totalStudyMinutes,
    completedCount,
    skippedCount,
    inProgressCount,
    completionRate: resolved > 0 ? Math.round((completedCount / resolved) * 100) : 0,
    streak: computeStreak(completedDaySet, today),
  };
}

export async function getDashboardData(userId) {
  await dbConnect();
  const adjustment = await autoReplanIfNeeded(userId);

  const user = await User.findById(userId).lean();
  const timeZone = user?.preferences?.timeZone || "UTC";
  const today = startOfToday(timeZone);

  const [subjects, todaySessions, allSessions] = await Promise.all([
    getSubjectsStats(userId),
    getSessionsDetailed(userId, { from: todayKey(timeZone), to: todayKey(timeZone) }),
    StudySession.find({ userId }).lean(),
  ]);
  const stats = overallStats(allSessions, today);

  const plannedMinutes = todaySessions.reduce((n, s) => n + (s.plannedMinutes || 0), 0);
  const completedMinutes = todaySessions
    .filter((s) => s.status === "completed")
    .reduce((n, s) => n + (s.actualMinutes || 0), 0);
  const todayProgress = {
    total: todaySessions.length,
    completedCount: todaySessions.filter((s) => s.status === "completed").length,
    plannedMinutes,
    completedMinutes,
    percent:
      plannedMinutes > 0 ? Math.min(100, Math.round((completedMinutes / plannedMinutes) * 100)) : 0,
  };

  let nextExam = null;
  for (const s of subjects) {
    const daysLeft = daysBetween(today, s.examDate);
    if (daysLeft >= 0 && (!nextExam || daysLeft < nextExam.daysLeft)) {
      nextExam = {
        id: s.id,
        name: s.name,
        color: s.color,
        examDate: s.examDate,
        daysLeft,
        progress: s.progress,
        topics: s.topics,
        completedTopics: s.completedTopics,
      };
    }
  }

  const atRisk = [];
  for (const s of subjects) {
    const pendingTopics = s.topics - s.completedTopics;
    if (pendingTopics <= 0) continue;
    const daysLeft = daysBetween(today, s.examDate);
    const base = { id: s.id, name: s.name, color: s.color, progress: s.progress, daysLeft };
    if (daysLeft < 0) {
      atRisk.push({ ...base, reason: "Exam date has passed with topics still incomplete" });
      continue;
    }
    if (daysLeft <= 14 && s.progress < 70) {
      atRisk.push({
        ...base,
        reason: `Only ${s.progress}% complete with ${daysLeft} day${daysLeft === 1 ? "" : "s"} until the exam`,
      });
      continue;
    }
    let capacity = 0;
    for (let d = today; d < startOfDay(new Date(`${s.examDate}T00:00:00.000Z`)); d = addDays(d, 1)) {
      capacity += getAvailabilityMinutes(user, d);
    }
    if (s.pendingMinutes > capacity) {
      atRisk.push({
        ...base,
        reason: `${formatMinutes(s.pendingMinutes)} of work left, only ${formatMinutes(capacity)} of study time before the exam`,
      });
    }
  }
  atRisk.sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    adjustment,
    todaySessions,
    todayProgress,
    stats: {
      totalStudyMinutes: stats.totalStudyMinutes,
      completionRate: stats.completionRate,
      completedCount: stats.completedCount,
      streak: stats.streak,
    },
    subjects,
    nextExam,
    atRisk: atRisk.slice(0, 4),
  };
}

export async function getProgressData(userId) {
  await dbConnect();
  const [user, subjects, allSessions] = await Promise.all([
    User.findById(userId).lean(),
    getSubjectsStats(userId),
    StudySession.find({ userId }).lean(),
  ]);
  const timeZone = user?.preferences?.timeZone || "UTC";
  const today = startOfToday(timeZone);
  const stats = overallStats(allSessions, today);

  const daily = [];
  for (let i = 6; i >= 0; i--) {
    const key = dayKey(addDays(today, -i));
    const daySessions = allSessions.filter((s) => dayKey(s.date) === key);
    daily.push({
      day: WEEKDAY_SHORT[weekdayOfKey(key)],
      planned: daySessions.reduce((n, s) => n + (s.plannedMinutes || 0), 0),
      completed: daySessions
        .filter((s) => s.status === "completed")
        .reduce((n, s) => n + (s.actualMinutes || 0), 0),
    });
  }

  const weekly = [];
  const thisWeekStart = startOfWeek(today);
  for (let w = 5; w >= 0; w--) {
    const ws = addDays(thisWeekStart, -7 * w);
    const we = addDays(ws, 6);
    const minutes = allSessions
      .filter((s) => s.date >= ws && s.date <= we && s.status === "completed")
      .reduce((n, s) => n + (s.actualMinutes || 0), 0);
    weekly.push({ week: formatShortDate(dayKey(ws)), minutes });
  }

  return {
    daily,
    weekly,
    subjects: subjects.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      progress: s.progress,
      topics: s.topics,
      completedTopics: s.completedTopics,
    })),
    stats: {
      totalStudyMinutes: stats.totalStudyMinutes,
      completionRate: stats.completionRate,
      completedCount: stats.completedCount,
      streak: stats.streak,
    },
  };
}

export function buildRecommendationContext(data) {
  return {
    studentSummary: {
      nextExam: data.nextExam
        ? { subject: data.nextExam.name, daysLeft: data.nextExam.daysLeft, progressPercent: data.nextExam.progress }
        : null,
      atRiskSubjects: data.atRisk.map((s) => ({
        subject: s.name,
        daysLeft: s.daysLeft,
        progressPercent: s.progress,
        reason: s.reason,
      })),
      completionRatePercent: data.stats.completionRate,
      missedSessionMinutes: data.adjustment.missedMinutes,
      currentStreakDays: data.stats.streak,
      today: {
        plannedSessions: data.todayProgress.total,
        completedSessions: data.todayProgress.completedCount,
        plannedMinutes: data.todayProgress.plannedMinutes,
      },
      pendingTopics: data.subjects.reduce((n, s) => n + Math.max(0, s.topics - s.completedTopics), 0),
    },
  };
}
