// Milestone badges — pure derivations from workoutHistory, no new persisted state
// beyond the history that already exists. Badges are permanent once earned (based
// on the *best-ever* streak, not the current one), so a broken streak doesn't take
// an already-unlocked badge away.
"use strict";

const BADGES = [
  { id: "first_workout", label: "First Workout", icon: "award", check: (s) => s.totalWorkouts >= 1 },
  { id: "workouts_10", label: "10 Workouts", icon: "award", check: (s) => s.totalWorkouts >= 10 },
  { id: "workouts_25", label: "25 Workouts", icon: "award", check: (s) => s.totalWorkouts >= 25 },
  { id: "workouts_50", label: "50 Workouts", icon: "award", check: (s) => s.totalWorkouts >= 50 },
  { id: "workouts_100", label: "Centurion", icon: "award", check: (s) => s.totalWorkouts >= 100 },
  { id: "streak_3", label: "3-Day Streak", icon: "flame", check: (s) => s.bestStreak >= 3 },
  { id: "streak_7", label: "Week Warrior", icon: "flame", check: (s) => s.bestStreak >= 7 },
  { id: "streak_14", label: "Two-Week Streak", icon: "flame", check: (s) => s.bestStreak >= 14 },
  { id: "streak_30", label: "Monthly Master", icon: "flame", check: (s) => s.bestStreak >= 30 },
  { id: "streak_60", label: "Unstoppable", icon: "flame", check: (s) => s.bestStreak >= 60 },
  { id: "streak_100", label: "Century Streak", icon: "flame", check: (s) => s.bestStreak >= 100 },
];

// Unlike computeStreak() (app.js), which only looks at the trailing run from
// today backwards, this scans the *entire* history for the longest consecutive-day
// run ever, so a badge earned during a since-broken streak stays earned.
function bestStreakEver(workoutHistory) {
  const dates = Array.from(new Set(workoutHistory.map((h) => h.date))).sort();
  let best = 0, current = 0, prev = null;
  for (const d of dates) {
    current = prev === null || daysBetween(prev, d) === 1 ? current + 1 : 1;
    if (current > best) best = current;
    prev = d;
  }
  return best;
}

function computeBadgeStats(workoutHistory) {
  return { totalWorkouts: workoutHistory.length, bestStreak: bestStreakEver(workoutHistory) };
}

function earnedBadgeIds(workoutHistory) {
  const stats = computeBadgeStats(workoutHistory);
  return new Set(BADGES.filter((b) => b.check(stats)).map((b) => b.id));
}

// Called with the history just before and just after Store.completeWorkout() —
// the delta is what THIS workout specifically unlocked, for the celebratory popup.
function newlyEarnedBadges(prevHistory, newHistory) {
  const before = earnedBadgeIds(prevHistory);
  const afterIds = earnedBadgeIds(newHistory);
  return BADGES.filter((b) => afterIds.has(b.id) && !before.has(b.id));
}
