import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateTopicProgress } from "../lib/utils.js";

test("calculateTopicProgress: shorter-than-planned session does not prematurely complete topic", () => {
  // Topic estimated at 60 minutes. Planned session was 60 min, but actual studied was only 25 min.
  const sessions = [{ plannedMinutes: 60, actualMinutes: 25 }];
  const progress = calculateTopicProgress(sessions, 60, false);

  assert.equal(progress.actualMinutes, 25);
  assert.equal(progress.plannedMinutes, 60);
  assert.equal(progress.estimatedMinutes, 60);
  assert.equal(progress.isCompleted, false);
  assert.equal(progress.progressPercent, 42); // 25/60 = 42%
});

test("calculateTopicProgress: longer-than-planned session completes topic when actual reaches estimate", () => {
  // Topic estimated at 45 minutes. Planned session was 30 min, but student studied 50 min.
  const sessions = [{ plannedMinutes: 30, actualMinutes: 50 }];
  const progress = calculateTopicProgress(sessions, 45, false);

  assert.equal(progress.actualMinutes, 50);
  assert.equal(progress.plannedMinutes, 30);
  assert.equal(progress.estimatedMinutes, 45);
  assert.equal(progress.isCompleted, true);
  assert.equal(progress.progressPercent, 100);
});

test("calculateTopicProgress: multiple sessions accumulate actual time towards completion", () => {
  // Topic estimated at 90 minutes.
  // Session 1: 30 planned, 30 actual -> 30/90 (not completed)
  // Session 2: 30 planned, 20 actual -> 50/90 (not completed)
  // Session 3: 30 planned, 45 actual -> 95/90 (completed!)
  const s1 = [{ plannedMinutes: 30, actualMinutes: 30 }];
  const p1 = calculateTopicProgress(s1, 90, false);
  assert.equal(p1.actualMinutes, 30);
  assert.equal(p1.isCompleted, false);
  assert.equal(p1.progressPercent, 33);

  const s2 = [...s1, { plannedMinutes: 30, actualMinutes: 20 }];
  const p2 = calculateTopicProgress(s2, 90, false);
  assert.equal(p2.actualMinutes, 50);
  assert.equal(p2.isCompleted, false);
  assert.equal(p2.progressPercent, 56);

  const s3 = [...s2, { plannedMinutes: 30, actualMinutes: 45 }];
  const p3 = calculateTopicProgress(s3, 90, false);
  assert.equal(p3.actualMinutes, 95);
  assert.equal(p3.isCompleted, true);
  assert.equal(p3.progressPercent, 100);
});

test("calculateTopicProgress: preserves manually completed topics even with zero or low actual minutes", () => {
  const sessions = [{ plannedMinutes: 60, actualMinutes: 10 }];
  const progress = calculateTopicProgress(sessions, 60, true);

  assert.equal(progress.actualMinutes, 10);
  assert.equal(progress.isCompleted, true);
});

test("calculateTopicProgress: handles exact boundary condition (59m vs 60m)", () => {
  const sessionsUnder = [{ plannedMinutes: 60, actualMinutes: 59 }];
  const pUnder = calculateTopicProgress(sessionsUnder, 60, false);
  assert.equal(pUnder.isCompleted, false);

  const sessionsExact = [{ plannedMinutes: 60, actualMinutes: 60 }];
  const pExact = calculateTopicProgress(sessionsExact, 60, false);
  assert.equal(pExact.isCompleted, true);
});

test("calculateTopicProgress: fallback to plannedMinutes if actualMinutes is not set", () => {
  const sessionsLegacy = [{ plannedMinutes: 60, actualMinutes: null }];
  const progress = calculateTopicProgress(sessionsLegacy, 60, false);
  assert.equal(progress.actualMinutes, 60);
  assert.equal(progress.isCompleted, true);
});
