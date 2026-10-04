"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadGlobal } = require("./load-global");

// badges.js calls the real daysBetween from storage.js — inlined here (matching
// storage.js exactly) instead of loading that file, since these tests exercise
// pure logic and shouldn't depend on load order beyond badges.js itself.
global.daysBetween = (isoA, isoB) => {
  const a = new Date(isoA), b = new Date(isoB);
  return Math.round((b - a) / 86400000);
};

loadGlobal("js/badges.js");

function workoutOn(date) {
  return { date, exerciseResults: [] };
}

test("bestStreakEver: consecutive days form a streak", () => {
  const history = [workoutOn("2026-01-01"), workoutOn("2026-01-02"), workoutOn("2026-01-03")];
  assert.equal(bestStreakEver(history), 3);
});

test("bestStreakEver: a gap breaks the streak", () => {
  const history = [workoutOn("2026-01-01"), workoutOn("2026-01-02"), workoutOn("2026-01-10")];
  assert.equal(bestStreakEver(history), 2);
});

test("bestStreakEver: stays at the longest run even after it's broken", () => {
  const history = [
    workoutOn("2026-01-01"), workoutOn("2026-01-02"), workoutOn("2026-01-03"),
    workoutOn("2026-01-04"), workoutOn("2026-01-05"), // 5-day streak
    workoutOn("2026-01-20"), // isolated, streak resets
  ];
  assert.equal(bestStreakEver(history), 5);
});

test("bestStreakEver: duplicate same-day entries don't inflate the count", () => {
  const history = [workoutOn("2026-01-01"), workoutOn("2026-01-01"), workoutOn("2026-01-02")];
  assert.equal(bestStreakEver(history), 2);
});

test("bestStreakEver: empty history is a zero streak", () => {
  assert.equal(bestStreakEver([]), 0);
});

test("earnedBadgeIds: unlocks workout-count and streak tiers independently", () => {
  const history = Array.from({ length: 10 }, (_, i) => workoutOn(`2026-01-${String(i + 1).padStart(2, "0")}`));
  const earned = earnedBadgeIds(history);
  assert.ok(earned.has("first_workout"));
  assert.ok(earned.has("workouts_10"));
  assert.ok(!earned.has("workouts_25"));
  assert.ok(earned.has("streak_7"));
  assert.ok(!earned.has("streak_14"));
});

test("newlyEarnedBadges: crossing a workout-count tier alone doesn't also report a streak badge", () => {
  // Non-consecutive dates (one every other month) keep bestStreak at 1 throughout,
  // isolating the workout-count crossing from any streak crossing.
  const before = Array.from({ length: 9 }, (_, i) => workoutOn(`2026-${String(i + 1).padStart(2, "0")}-01`));
  const after = before.concat([workoutOn("2026-10-01")]);
  const newly = newlyEarnedBadges(before, after).map((b) => b.id);
  assert.deepEqual(newly, ["workouts_10"]);
});

test("newlyEarnedBadges: crossing a streak tier alone doesn't also report a workout-count badge", () => {
  const before = Array.from({ length: 6 }, (_, i) => workoutOn(`2026-01-${String(i + 1).padStart(2, "0")}`));
  const after = before.concat([workoutOn("2026-01-07")]); // 7th consecutive day
  const newly = newlyEarnedBadges(before, after).map((b) => b.id);
  assert.deepEqual(newly, ["streak_7"]);
});

test("newlyEarnedBadges: returns nothing when no new tier is crossed", () => {
  const before = [workoutOn("2026-01-01"), workoutOn("2026-01-02")];
  const after = before.concat([workoutOn("2026-02-15")]); // 3rd workout, streak broken
  const newly = newlyEarnedBadges(before, after);
  assert.deepEqual(newly, []);
});
