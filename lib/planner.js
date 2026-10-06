import { DAY_MS, addDays, dayKey, startOfDay } from "./utils.js";

/**
 * Deterministic study-plan engine.
 * The AI NEVER decides dates, capacity or deadlines — only this module does.
 */

const DIFFICULTY_BOOST = { easy: 0.5, medium: 1, hard: 1.5 };

/** Minutes available on a given day (weekday override -> daily default). */
export function getAvailabilityMinutes(user, date) {
  const prefs = (user && user.preferences) || {};
  const weekly = prefs.weeklyAvailability || {};
  const raw = weekly[String(new Date(date).getUTCDay())];
  if (typeof raw === "number" && raw >= 0) return Math.round(raw);
  return prefs.dailyStudyMinutes || 120;
}

/** Split a topic's minutes into practical session chunks (30/45/60/90-ish). */
export function splitIntoSessions(totalMinutes) {
  const total = Math.max(15, Math.round(Number(totalMinutes) || 0));
  if (total <= 90) return [total];
  const parts = [];
  let remaining = total;
  while (remaining > 90) {
    let chunk = 60;
    if (remaining - chunk < 30) chunk = remaining - 45; // leave a practical remainder
    parts.push(chunk);
    remaining -= chunk;
  }
  parts.push(remaining);
  return parts;
}

/** Priority score: closer exams, importance, difficulty and remaining workload score higher. */
export function topicPriorityScore({ topic, subject, today, pendingMinutes = 0 }) {
  const examDay = startOfDay(subject.examDate instanceof Date ? subject.examDate : new Date(`${subject.examDate}T00:00:00.000Z`));
  const daysToExam = Math.round((examDay - today) / DAY_MS);
  const urgency = daysToExam <= 0 ? 12 : Math.min(10, 30 / daysToExam + 1);
  const diffBoost = DIFFICULTY_BOOST[topic.difficulty] ?? 1;
  const workloadBoost = Math.min(1.5, pendingMinutes / 240);
  return urgency * 2 + (topic.importance || 5) + diffBoost + workloadBoost;
}

/**
 * Build the ordered work queue from incomplete topics.
 * doneByTopic / activeByTopic subtract work already completed or actively in progress.
 */
export function buildTopicQueue({ topics, subjects, today, doneByTopic = {}, activeByTopic = {} }) {
  const subjectMap = new Map(subjects.map((s) => [String(s._id), s]));
  const items = [];
  for (const topic of topics) {
    if (topic.completed) continue;
    const subject = subjectMap.get(String(topic.subjectId));
    if (!subject || !subject.examDate) continue;
    const estimated = topic.estimatedMinutes || 60;
    const pending =
      estimated - (doneByTopic[String(topic._id)] || 0) - (activeByTopic[String(topic._id)] || 0);
    if (pending <= 0) continue;
    const deadline = addDays(
      startOfDay(subject.examDate instanceof Date ? subject.examDate : new Date(`${subject.examDate}T00:00:00.000Z`)),
      -1
    ); // last schedulable day = day before the exam
    const score = topicPriorityScore({ topic, subject, today, pendingMinutes: pending });
    splitIntoSessions(pending).forEach((minutes, seq) => {
      items.push({ subjectId: subject._id, topicId: topic._id, minutes, score, seq, deadline });
    });
  }
  return items;
}

/**
 * Allocate sessions chronologically into available slots.
 * Hard rules: scheduled minutes <= available minutes, never after the subject's exam,
 * max 8 sessions/day. Returns { scheduled, dropped }.
 */
export function allocateSessions({
  items,
  availabilityFor,
  startDate,
  existingLoadByDay = {},
  maxDays = 180,
  maxSessionsPerDay = 8,
}) {
  const queue = [...items].sort(
    (a, b) =>
      b.score - a.score ||
      a.seq - b.seq ||
      (String(a.topicId) < String(b.topicId) ? -1 : 1)
  );
  const scheduled = [];
  const dropped = [];
  let day = startOfDay(startDate);
  let iterations = 0;

  while (queue.length > 0 && iterations < maxDays) {
    const key = dayKey(day);
    const capacity = Math.max(0, availabilityFor(day) - (existingLoadByDay[key] || 0));
    let used = 0;
    let placed = 0;
    for (let i = 0; i < queue.length && placed < maxSessionsPerDay; ) {
      const item = queue[i];
      if (day > item.deadline) {
        dropped.push(item);
        queue.splice(i, 1);
        continue;
      }
      if (item.minutes <= capacity - used) {
        scheduled.push({ ...item, date: new Date(day.getTime()) });
        used += item.minutes;
        placed += 1;
        queue.splice(i, 1);
      } else {
        i += 1; // try a smaller item (best fit) to fill the day
      }
    }
    day = addDays(day, 1);
    iterations += 1;
  }
  dropped.push(...queue);
  return { scheduled, dropped };
}
