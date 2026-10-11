import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DAY_MS,
  addDays,
  dayKey,
  daysBetween,
  isValidTimeZone,
  parseDayKey,
  startOfToday,
  todayKey,
} from "../lib/utils.js";

test("isValidTimeZone accepts IANA zones and rejects junk", () => {
  assert.equal(isValidTimeZone("UTC"), true);
  assert.equal(isValidTimeZone("Asia/Kolkata"), true);
  assert.equal(isValidTimeZone("America/New_York"), true);
  assert.equal(isValidTimeZone("Not/AZone"), false);
  assert.equal(isValidTimeZone(""), false);
  assert.equal(isValidTimeZone(null), false);
  assert.equal(isValidTimeZone(undefined), false);
});

test("dayKey without a zone falls back to UTC (historical behaviour)", () => {
  assert.equal(dayKey("2024-01-10T20:00:00.000Z"), "2024-01-10");
  assert.equal(dayKey("2024-01-10T23:59:59.000Z"), "2024-01-10");
  assert.equal(dayKey("2024-01-10T20:00:00.000Z", "Not/AZone"), "2024-01-10");
});

test("dayKey resolves the calendar day in the user's zone", () => {
  const instant = "2024-01-10T20:00:00.000Z";
  assert.equal(dayKey(instant, "UTC"), "2024-01-10");
  assert.equal(dayKey(instant, "Asia/Kolkata"), "2024-01-11"); // +5:30 -> 01:30 next day
  assert.equal(dayKey(instant, "America/Los_Angeles"), "2024-01-10"); // -8 -> 12:00 same day
});

test("dayKey handles extreme offsets around midnight", () => {
  // -11: an early-UTC instant is still the previous local day.
  assert.equal(dayKey("2024-01-10T02:00:00.000Z", "Pacific/Pago_Pago"), "2024-01-09");
  // +14: a midday-UTC instant is already the next local day.
  assert.equal(dayKey("2024-01-10T12:00:00.000Z", "Pacific/Kiritimati"), "2024-01-11");
});

test("dayKey is correct across a DST spring-forward (America/New_York)", () => {
  // DST begins 2024-03-10 at 07:00Z (02:00 -> 03:00 local).
  assert.equal(dayKey("2024-03-10T04:00:00.000Z", "America/New_York"), "2024-03-09"); // 23:00 EST
  assert.equal(dayKey("2024-03-10T12:00:00.000Z", "America/New_York"), "2024-03-10"); // 08:00 EDT
});

test("startOfToday is the UTC anchor of the user's local today", () => {
  for (const tz of ["UTC", "Asia/Kolkata", "Pacific/Kiritimati", "Pacific/Pago_Pago"]) {
    const anchor = startOfToday(tz);
    // The anchor read back in UTC equals the local calendar day key.
    assert.equal(dayKey(anchor), todayKey(tz));
    // It is a clean UTC midnight.
    assert.equal(anchor.getUTCHours(), 0);
    assert.equal(anchor.getTime() % DAY_MS, 0);
  }
});

test("day anchors stay exactly 24h apart (DST-safe arithmetic)", () => {
  const base = parseDayKey("2024-03-10"); // around a US DST transition
  assert.equal(daysBetween(base, addDays(base, 5)), 5);
  assert.equal(addDays(base, 1).getTime() - base.getTime(), DAY_MS);
});

test("exam-style calendar dates never shift across zones", () => {
  // Exam dates are stored/read as plain YYYY-MM-DD via parseDayKey, so the day
  // key round-trips regardless of any user time zone.
  assert.equal(dayKey(parseDayKey("2024-06-20")), "2024-06-20");
});
