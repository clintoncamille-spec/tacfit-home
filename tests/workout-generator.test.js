"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadGlobal } = require("./load-global");

loadGlobal("js/workout-generator.js");

function resultWithDifficulty(exerciseId, difficulty) {
  return { date: "2026-01-01", exerciseResults: [{ exerciseId, difficulty }] };
}

test("difficultyMultiplier: no history yields the neutral multiplier", () => {
  assert.equal(difficultyMultiplier("pushup", []), 1);
});

test("difficultyMultiplier: majority 'easy' scales reps up", () => {
  const history = [
    resultWithDifficulty("pushup", "easy"),
    resultWithDifficulty("pushup", "easy"),
    resultWithDifficulty("pushup", "hard"),
  ];
  assert.equal(difficultyMultiplier("pushup", history), DIFFICULTY_EASY_MULTIPLIER);
});

test("difficultyMultiplier: majority 'hard' scales reps down", () => {
  const history = [
    resultWithDifficulty("pushup", "hard"),
    resultWithDifficulty("pushup", "hard"),
    resultWithDifficulty("pushup", "easy"),
  ];
  assert.equal(difficultyMultiplier("pushup", history), DIFFICULTY_HARD_MULTIPLIER);
});

test("difficultyMultiplier: a tie stays neutral", () => {
  const history = [resultWithDifficulty("pushup", "easy"), resultWithDifficulty("pushup", "hard")];
  assert.equal(difficultyMultiplier("pushup", history), 1);
});

test("difficultyMultiplier: only looks at the most recent DIFFICULTY_LOOKBACK ratings", () => {
  // Two old "hard" ratings would tie/outweigh the two recent "easy" ones if not
  // limited to the lookback window — this is the exact regression the adaptive
  // difficulty feature must not reintroduce (reps should never run away over time).
  const history = [
    resultWithDifficulty("pushup", "hard"),
    resultWithDifficulty("pushup", "hard"),
    resultWithDifficulty("pushup", "easy"),
    resultWithDifficulty("pushup", "easy"),
    resultWithDifficulty("pushup", "easy"),
  ];
  assert.equal(difficultyMultiplier("pushup", history), DIFFICULTY_EASY_MULTIPLIER);
});

test("difficultyMultiplier: ratings for a different exercise are ignored", () => {
  const history = [resultWithDifficulty("pullup", "hard"), resultWithDifficulty("pullup", "hard")];
  assert.equal(difficultyMultiplier("pushup", history), 1);
});

test("adjustedSetsReps: repeated calls with the plan's static base reps never drift upward", () => {
  // The real guarantee lives at the call sites (startWorkout/startWorkoutFromTemplate/
  // planChecklistHTML in app.js): they always pass the plan's original static reps,
  // never a previously-adjusted value. This confirms the function itself holds up
  // its end — same static input + same history always yields the same output,
  // rather than drifting if called again (e.g. on a re-render).
  const history = [resultWithDifficulty("pushup", "easy"), resultWithDifficulty("pushup", "easy")];
  const first = adjustedSetsReps(3, 10, "pushup", history);
  const second = adjustedSetsReps(3, 10, "pushup", history);
  assert.equal(first.reps, second.reps);
});

test("adjustedSetsReps: sets are left untouched, only reps move", () => {
  const history = [resultWithDifficulty("pushup", "hard"), resultWithDifficulty("pushup", "hard")];
  const result = adjustedSetsReps(4, 10, "pushup", history);
  assert.equal(result.sets, 4);
  assert.equal(result.reps, Math.max(1, Math.round(10 * DIFFICULTY_HARD_MULTIPLIER)));
});

test("adjustedSetsReps: never rounds reps down to zero", () => {
  const history = [resultWithDifficulty("plank", "hard"), resultWithDifficulty("plank", "hard")];
  const result = adjustedSetsReps(3, 1, "plank", history);
  assert.ok(result.reps >= 1);
});

test("safeForProfile: excludes an exercise that conflicts with a listed injury", () => {
  const exercise = { avoidInjuries: ["wrist"] };
  assert.equal(safeForProfile(exercise, { injuries: ["wrist"] }), false);
});

test("safeForProfile: allows an exercise with no conflicting injuries", () => {
  const exercise = { avoidInjuries: ["knee"] };
  assert.equal(safeForProfile(exercise, { injuries: ["wrist"] }), true);
});

test("safeForProfile: treats a missing injuries list as no injuries", () => {
  const exercise = { avoidInjuries: ["knee"] };
  assert.equal(safeForProfile(exercise, {}), true);
});

test("scaleFor: falls back to beginner scaling for an unrecognized experience level", () => {
  const exercise = { id: "situp", isHold: false, scale: { beginner: [3, 10] } };
  assert.deepEqual(scaleFor(exercise, { experience: "expert" }), { sets: 3, reps: 10 });
});

test("scaleFor: a strong pushupsMax raises reps above the base scale", () => {
  const exercise = { id: "pushup", isHold: false, scale: { beginner: [3, 10] } };
  const result = scaleFor(exercise, { experience: "beginner", pushupsMax: 40 });
  assert.equal(result.sets, 3);
  assert.equal(result.reps, Math.round(40 * 0.6));
});

test("scaleFor: a hold exercise's reps (seconds) are never boosted by pushupsMax", () => {
  const exercise = { id: "plankhold", isHold: true, scale: { beginner: [3, 30] } };
  const result = scaleFor(exercise, { experience: "beginner", pushupsMax: 100 });
  assert.equal(result.reps, 30);
});
