import assert from "node:assert/strict";
import { test } from "node:test";
import { validateReschedule } from "../lib/utils.js";
import { rescheduleSessionSchema } from "../lib/validation.js";

test("rescheduleSessionSchema: validates correct YYYY-MM-DD dates", () => {
  const valid = rescheduleSessionSchema.safeParse({ date: "2026-10-25" });
  assert.equal(valid.success, true);
  assert.equal(valid.data.date, "2026-10-25");
});

test("rescheduleSessionSchema: rejects malformed or non-date strings", () => {
  assert.equal(rescheduleSessionSchema.safeParse({ date: "not-a-date" }).success, false);
  assert.equal(rescheduleSessionSchema.safeParse({ date: "2026/10/25" }).success, false);
  assert.equal(rescheduleSessionSchema.safeParse({ date: "" }).success, false);
  assert.equal(rescheduleSessionSchema.safeParse({}).success, false);
});

test("validateReschedule: allows rescheduling a planned session to a valid target date", () => {
  const session = {
    id: "session-1",
    status: "planned",
    plannedMinutes: 45,
  };
  const result = validateReschedule({
    session,
    examDate: "2026-11-15",
    targetDateStr: "2026-10-20",
    dayCapacity: 120,
    existingDayMinutes: 30,
  });

  assert.equal(result.valid, true);
  assert.equal(result.warning, null);
});

test("validateReschedule: rejects rescheduling completed sessions", () => {
  const session = {
    id: "session-1",
    status: "completed",
    plannedMinutes: 45,
  };
  const result = validateReschedule({
    session,
    examDate: "2026-11-15",
    targetDateStr: "2026-10-20",
  });

  assert.equal(result.valid, false);
  assert.match(result.error, /Cannot reschedule a completed session/i);
});

test("validateReschedule: rejects rescheduling skipped sessions", () => {
  const session = {
    id: "session-1",
    status: "skipped",
    plannedMinutes: 45,
  };
  const result = validateReschedule({
    session,
    examDate: "2026-11-15",
    targetDateStr: "2026-10-20",
  });

  assert.equal(result.valid, false);
  assert.match(result.error, /Cannot reschedule a skipped session/i);
});

test("validateReschedule: rejects target date that is strictly after the exam deadline", () => {
  const session = {
    id: "session-1",
    status: "planned",
    plannedMinutes: 60,
  };
  const result = validateReschedule({
    session,
    examDate: "2026-10-20",
    targetDateStr: "2026-10-25",
  });

  assert.equal(result.valid, false);
  assert.match(result.error, /Cannot reschedule past exam deadline/i);
});

test("validateReschedule: allows scheduling on the exact exam date", () => {
  const session = {
    id: "session-1",
    status: "planned",
    plannedMinutes: 60,
  };
  const result = validateReschedule({
    session,
    examDate: "2026-10-20",
    targetDateStr: "2026-10-20",
    dayCapacity: 120,
    existingDayMinutes: 0,
  });

  assert.equal(result.valid, true);
  assert.equal(result.warning, null);
});

test("validateReschedule: warns when total target date load exceeds daily availability", () => {
  const session = {
    id: "session-1",
    status: "planned",
    plannedMinutes: 60,
  };
  const result = validateReschedule({
    session,
    examDate: "2026-11-20",
    targetDateStr: "2026-10-20",
    dayCapacity: 90,
    existingDayMinutes: 60, // 60 + 60 = 120 > 90
  });

  assert.equal(result.valid, true);
  assert.ok(result.warning);
  assert.match(result.warning, /exceeds your daily availability/i);
});
