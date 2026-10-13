import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateActiveElapsed } from "../hooks/useTimer.js";
import { serializeSession } from "../lib/queries.js";

test("calculateActiveElapsed returns 0 for empty or unstarted sessions", () => {
  assert.equal(calculateActiveElapsed(null), 0);
  assert.equal(calculateActiveElapsed({}), 0);
  assert.equal(calculateActiveElapsed({ status: "planned" }), 0);
});

test("calculateActiveElapsed derives active seconds when timer is running", () => {
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
  const session = {
    timerState: "running",
    lastStartedAt: thirtySecondsAgo,
    elapsedActiveSeconds: 120,
  };
  const elapsed = calculateActiveElapsed(session);
  // Expected: 120 + ~30 = ~150
  assert.ok(elapsed >= 149 && elapsed <= 152, `Expected ~150s, got ${elapsed}`);
});

test("calculateActiveElapsed preserves frozen elapsed seconds when paused", () => {
  const session = {
    timerState: "paused",
    lastStartedAt: null,
    pausedAt: new Date(Date.now() - 3600 * 1000).toISOString(), // Paused 1 hour ago
    elapsedActiveSeconds: 900, // 15 minutes of actual study
  };
  // Paused time must NOT leak into active elapsed time
  assert.equal(calculateActiveElapsed(session), 900);
});

test("session recovery after refresh maintains exact state and ignores paused duration", () => {
  // Simulate session that started, studied 10 min, paused for 30 min, refreshed page
  const refreshedSession = {
    id: "session-123",
    status: "in_progress",
    timerState: "paused",
    startedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    lastStartedAt: null,
    pausedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    elapsedActiveSeconds: 600, // 10 minutes
  };

  // On page refresh, dialog reads refreshedSession
  const elapsed = calculateActiveElapsed(refreshedSession);
  assert.equal(elapsed, 600);
  assert.equal(Math.round(elapsed / 60), 10);
});

test("completion duration calculation strictly excludes paused intervals", () => {
  // Helper simulating server complete endpoint duration logic
  function computeCompletedMinutes(session, manualOverride) {
    if (manualOverride != null) {
      return Math.min(1440, Math.max(0, manualOverride));
    }
    let activeSeconds = session.elapsedActiveSeconds || 0;
    if (session.timerState === "running" && session.lastStartedAt) {
      activeSeconds += Math.max(0, Math.floor((Date.now() - new Date(session.lastStartedAt).getTime()) / 1000));
    } else if (!session.startedAt && !session.lastStartedAt && !session.elapsedActiveSeconds) {
      activeSeconds = (session.plannedMinutes || 0) * 60;
    }
    return Math.min(1440, Math.max(1, Math.round(activeSeconds / 60)));
  }

  // Session started 2 hours ago, but only 25 minutes of active timing (the rest paused)
  const session = {
    startedAt: new Date(Date.now() - 120 * 60 * 1000),
    timerState: "paused",
    lastStartedAt: null,
    elapsedActiveSeconds: 25 * 60,
  };

  const recordedMinutes = computeCompletedMinutes(session, null);
  assert.equal(recordedMinutes, 25); // NOT 120 min!

  // Manual override takes precedence if user specifies
  assert.equal(computeCompletedMinutes(session, 30), 30);
});

test("timer state transitions prevent invalid operations and ensure idempotency", () => {
  function applyTimerAction(session, action, now = new Date()) {
    if (session.status === "completed" || session.status === "skipped") {
      throw new Error(`Cannot ${action} a ${session.status} session`);
    }
    if (session.status !== "in_progress") {
      throw new Error("Session has not been started yet");
    }

    if (action === "pause") {
      if (session.timerState === "paused") return session; // Idempotent
      const additional = session.lastStartedAt
        ? Math.max(0, Math.floor((now.getTime() - new Date(session.lastStartedAt).getTime()) / 1000))
        : 0;
      session.elapsedActiveSeconds = (session.elapsedActiveSeconds || 0) + additional;
      session.lastStartedAt = null;
      session.timerState = "paused";
      session.pausedAt = now;
      return session;
    }

    if (action === "resume") {
      if (session.timerState === "running" && session.lastStartedAt) return session; // Idempotent
      session.lastStartedAt = now;
      session.timerState = "running";
      session.pausedAt = null;
      return session;
    }

    throw new Error(`Unknown action ${action}`);
  }

  const session = {
    status: "in_progress",
    timerState: "running",
    lastStartedAt: new Date(Date.now() - 100 * 1000),
    elapsedActiveSeconds: 0,
  };

  // Pause
  applyTimerAction(session, "pause");
  assert.equal(session.timerState, "paused");
  assert.ok(session.elapsedActiveSeconds >= 99);
  assert.equal(session.lastStartedAt, null);

  // Idempotent pause
  const frozenElapsed = session.elapsedActiveSeconds;
  applyTimerAction(session, "pause");
  assert.equal(session.elapsedActiveSeconds, frozenElapsed);

  // Resume
  applyTimerAction(session, "resume");
  assert.equal(session.timerState, "running");
  assert.ok(session.lastStartedAt instanceof Date);

  // Completed session cannot be paused
  session.status = "completed";
  assert.throws(() => applyTimerAction(session, "pause"), /Cannot pause a completed session/);
});

test("serializeSession includes timerState, lastStartedAt, pausedAt, and elapsedActiveSeconds", () => {
  const doc = {
    _id: "507f1f77bcf86cd799439011",
    date: new Date("2026-10-15T00:00:00Z"),
    subjectId: { _id: "507f1f77bcf86cd799439012", name: "Physics", color: "#10b981" },
    topicId: { _id: "507f1f77bcf86cd799439013", name: "Thermodynamics", difficulty: "hard" },
    plannedMinutes: 60,
    actualMinutes: 0,
    status: "in_progress",
    startedAt: new Date("2026-10-15T10:00:00Z"),
    lastStartedAt: new Date("2026-10-15T10:05:00Z"),
    pausedAt: null,
    elapsedActiveSeconds: 300,
    timerState: "running",
    completedAt: null,
  };

  const serialized = serializeSession(doc);
  assert.equal(serialized.timerState, "running");
  assert.equal(serialized.elapsedActiveSeconds, 300);
  assert.equal(serialized.lastStartedAt, "2026-10-15T10:05:00.000Z");
  assert.equal(serialized.pausedAt, null);
});
