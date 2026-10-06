import { formatMinutes } from "./utils.js";

/**
 * Provider-independent AI layer (OpenAI-compatible /chat/completions).
 * Swap providers by changing AI_BASE_URL / AI_MODEL / AI_API_KEY — nothing else.
 * Every call is wrapped so AI failures NEVER crash the app.
 */

export class AiError extends Error {}

export function isAiConfigured() {
  return Boolean(process.env.AI_API_KEY);
}

function aiConfig() {
  return {
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || "gpt-4o-mini",
    baseUrl: (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
  };
}

async function chatCompletion({ system, user, json = false, temperature = 0.4, maxTokens = 800, timeoutMs = 15000 }) {
  const { apiKey, model, baseUrl } = aiConfig();
  if (!apiKey) throw new AiError("AI is not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new AiError(`AI request failed (${res.status})`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new AiError("Empty AI response");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonLoose(text) {
  const cleaned = String(text).replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
  }
  throw new AiError("Invalid JSON from AI");
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** AI feature #1/#2: syllabus breakdown with difficulty + time estimates. */
export async function generateSyllabusTopics(subjectName) {
  const system = [
    "You are a study-planning assistant.",
    "Given a subject, list its core syllabus topics for exam preparation.",
    'Respond ONLY with JSON of shape {"topics":[{"name":string,"difficulty":"easy"|"medium"|"hard","estimatedMinutes":number,"importance":number}]}',
    "estimatedMinutes is between 20 and 240, importance is 1-10, and there are 6-12 topics.",
  ].join(" ");
  const raw = await chatCompletion({ system, user: `Subject: ${subjectName}`, json: true, maxTokens: 900 });
  const parsed = parseJsonLoose(raw);
  const arr = Array.isArray(parsed?.topics) ? parsed.topics : Array.isArray(parsed) ? parsed : null;
  if (!arr) throw new AiError("Invalid AI response shape");

  const topics = arr
    .map((t) => ({
      name: String(t?.name ?? "").trim().slice(0, 120),
      difficulty: ["easy", "medium", "hard"].includes(t?.difficulty) ? t.difficulty : "medium",
      estimatedMinutes: clampInt(t?.estimatedMinutes, 20, 240, 60),
      importance: clampInt(t?.importance, 1, 10, 5),
    }))
    .filter((t) => t.name.length > 0)
    .slice(0, 15);
  if (!topics.length) throw new AiError("AI returned no usable topics");
  return topics;
}

/** AI feature #3: short recommendation. */
export async function generateRecommendation(context) {
  const system = [
    "You are StudyFlow's study coach.",
    "Given a JSON summary of a student's status, write ONE short actionable recommendation.",
    "Maximum 2 sentences and 45 words. Be specific: reference concrete subjects, days or numbers from the data.",
    "No preamble, no markdown.",
  ].join(" ");
  const raw = await chatCompletion({
    system,
    user: JSON.stringify(context),
    temperature: 0.5,
    maxTokens: 120,
    timeoutMs: 8000,
  });
  const text = String(raw).trim();
  if (!text) throw new AiError("Empty AI recommendation");
  return text.slice(0, 400);
}

/** Deterministic rule-based fallback — used whenever AI is unavailable/fails. */
export function fallbackRecommendation(context) {
  const s = context?.studentSummary || {};
  const parts = [];
  if (s.missedSessionMinutes > 0) {
    parts.push(`You have ${formatMinutes(s.missedSessionMinutes)} of unfinished work — recalculate your plan to redistribute it across coming days.`);
  }
  if (Array.isArray(s.atRiskSubjects) && s.atRiskSubjects.length > 0) {
    const r = s.atRiskSubjects[0];
    parts.push(`${r.subject} is your highest-risk subject: exam in ${r.daysLeft} day(s) with only ${r.progressPercent}% of topics completed.`);
  } else if (s.nextExam) {
    parts.push(
      `Your next exam is ${s.nextExam.subject} in ${s.nextExam.daysLeft} day(s) — you're ${s.nextExam.progressPercent}% through it. Keep up your daily sessions.`
    );
  } else if (s.pendingTopics > 0) {
    parts.push("No exam dates detected. Add exam dates so StudyFlow can prioritize your plan.");
  }
  if (parts.length === 0) {
    parts.push("You're all caught up — consistency beats cramming.");
  }
  return parts.slice(0, 2).join(" ");
}

/** Safe wrapper: AI first (if configured), rule-based fallback otherwise. Never throws. */
export async function getRecommendationSafe(context) {
  if (isAiConfigured()) {
    try {
      const text = await generateRecommendation(context);
      if (text) return { text, source: "ai" };
    } catch (err) {
      console.error("AI recommendation failed:", err?.message || err);
    }
  }
  return { text: fallbackRecommendation(context), source: "rule" };
}
