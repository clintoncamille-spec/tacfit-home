// Builds a rotating weekly plan from the user's profile: frequency, duration,
// experience, injuries (exclusion filter) and problem areas (prioritization).

const DAY_TEMPLATES_BY_FREQ = {
  1: ["Full Body Circuit"],
  2: ["Full Body Circuit", "Full Body Circuit"],
  3: ["Upper Body + Core", "Lower Body + Cardio", "Full Body Circuit"],
  4: ["Upper Body", "Lower Body", "Core & Cardio", "Full Body Circuit"],
  5: ["Upper Body", "Lower Body", "Core & Cardio", "Upper Body", "Full Body Circuit"],
  6: ["Upper Body", "Lower Body", "Core & Cardio", "Upper Body", "Lower Body", "Cardio Conditioning"],
  7: ["Upper Body", "Lower Body", "Core & Cardio", "Upper Body", "Lower Body", "Cardio Conditioning", "Full Body Circuit"],
};

const CATEGORY_MIX = {
  "Upper Body": { upper: 0.7, core: 0.3 },
  "Lower Body": { lower: 0.7, core: 0.3 },
  "Core & Cardio": { core: 0.5, cardio: 0.5 },
  "Cardio Conditioning": { cardio: 0.6, core: 0.4 },
  "Full Body Circuit": { upper: 0.25, lower: 0.25, core: 0.25, cardio: 0.25 },
  "Upper Body + Core": { upper: 0.6, core: 0.4 },
  "Lower Body + Cardio": { lower: 0.6, cardio: 0.4 },
};

const DURATION_TO_COUNT = { 15: 4, 20: 5, 30: 6, 45: 8, 60: 10 };

function exerciseCountForDuration(durationMin) {
  return DURATION_TO_COUNT[durationMin] || Math.max(4, Math.round(durationMin / 6));
}

function safeForProfile(exercise, profile) {
  const injuries = profile.injuries || [];
  return !exercise.avoidInjuries.some((i) => injuries.includes(i));
}

function poolForCategory(category, profile) {
  return EXERCISES.filter((e) => e.category === category && safeForProfile(e, profile));
}

// Problem-area targeted exercises float to the front; a rotation offset then
// walks the pool so consecutive plan-days don't repeat the exact same picks.
function pickFromPool(pool, n, profile, offset) {
  if (pool.length === 0) return [];
  const scored = pool.map((e) => ({
    e,
    priority: (e.targets || []).some((t) => (profile.problemAreas || []).includes(t)) ? 0 : 1,
  }));
  scored.sort((a, b) => a.priority - b.priority);
  const ordered = scored.map((s) => s.e);
  const picks = [];
  for (let i = 0; i < n; i++) {
    picks.push(ordered[(i + offset) % ordered.length]);
  }
  // de-dupe while preserving count by pulling replacements from the rest of the pool
  const seen = new Set();
  const result = [];
  for (const ex of picks) {
    if (!seen.has(ex.id)) { seen.add(ex.id); result.push(ex); }
  }
  let extraIdx = 0;
  while (result.length < Math.min(n, ordered.length) && extraIdx < ordered.length) {
    const ex = ordered[extraIdx++];
    if (!seen.has(ex.id)) { seen.add(ex.id); result.push(ex); }
  }
  return result;
}

function scaleFor(exercise, profile) {
  const level = profile.experience || "beginner";
  const [sets, reps] = exercise.scale[level] || exercise.scale.beginner;
  let adjustedReps = reps;
  if (!exercise.isHold) {
    if (/pushup|dip/.test(exercise.id) && profile.pushupsMax) {
      adjustedReps = Math.max(reps, Math.round(profile.pushupsMax * 0.6));
    } else if (/pullup|chinup|invertedrow/.test(exercise.id) && profile.pullupsMax) {
      adjustedReps = Math.max(reps, Math.round(profile.pullupsMax * 0.6)) || reps;
    }
  }
  return { sets, reps: adjustedReps };
}

// Adaptive difficulty: looks at the most recent "Too Easy / Just Right / Too Hard"
// ratings logged for this exercise (see sessionExerciseCard/finishWorkout in app.js)
// and nudges reps up or down for the *next* time this exercise is started. Applied
// fresh to the static plan/template numbers each time a session starts (not
// compounded onto a previously-adjusted value), so it can't run away over time.
const DIFFICULTY_LOOKBACK = 3;
const DIFFICULTY_EASY_MULTIPLIER = 1.15;
const DIFFICULTY_HARD_MULTIPLIER = 0.85;

function recentDifficulties(exerciseId, workoutHistory, limit) {
  const ratings = [];
  for (const w of workoutHistory) {
    for (const r of w.exerciseResults || []) {
      if (r.exerciseId === exerciseId && r.difficulty) ratings.push(r.difficulty);
    }
  }
  return ratings.slice(-(limit || DIFFICULTY_LOOKBACK));
}

function difficultyMultiplier(exerciseId, workoutHistory) {
  const recent = recentDifficulties(exerciseId, workoutHistory, DIFFICULTY_LOOKBACK);
  const easyCount = recent.filter((d) => d === "easy").length;
  const hardCount = recent.filter((d) => d === "hard").length;
  if (hardCount > easyCount) return DIFFICULTY_HARD_MULTIPLIER;
  if (easyCount > hardCount) return DIFFICULTY_EASY_MULTIPLIER;
  return 1;
}

// Adjusts only reps/hold-seconds, not sets — a smoother, more granular dial than
// adding or dropping whole sets.
function adjustedSetsReps(sets, reps, exerciseId, workoutHistory) {
  const multiplier = difficultyMultiplier(exerciseId, workoutHistory);
  const adjustedReps = multiplier === 1 ? reps : Math.max(1, Math.round(reps * multiplier));
  return { sets, reps: adjustedReps };
}

function buildWeeklyPlan(profile) {
  const freq = Math.min(7, Math.max(1, profile.prescribedFrequency || 3));
  const template = DAY_TEMPLATES_BY_FREQ[freq];
  const count = exerciseCountForDuration(profile.duration || 30);

  const allSafe = EXERCISES.filter((e) => safeForProfile(e, profile));

  const days = template.map((label, dayIndex) => {
    const mix = CATEGORY_MIX[label];
    const exercises = [];
    const usedIds = new Set();
    let shortfall = 0;

    for (const [category, share] of Object.entries(mix)) {
      const n = Math.max(1, Math.round(count * share));
      const pool = poolForCategory(category, profile);
      const picks = pickFromPool(pool, n, profile, dayIndex);
      picks.forEach((ex) => usedIds.add(ex.id));
      shortfall += n - picks.length;
      for (const ex of picks) {
        const { sets, reps } = scaleFor(ex, profile);
        exercises.push({ exerciseId: ex.id, sets, reps });
      }
    }

    // A category may come up short (e.g. injuries rule out most lower-body moves) —
    // top the day back up from any other safe exercise rather than leaving it sparse.
    if (shortfall > 0) {
      const backfillPool = allSafe.filter((e) => !usedIds.has(e.id));
      const backfill = pickFromPool(backfillPool, shortfall, profile, dayIndex);
      for (const ex of backfill) {
        usedIds.add(ex.id);
        const { sets, reps } = scaleFor(ex, profile);
        exercises.push({ exerciseId: ex.id, sets, reps });
      }
    }

    return { dayIndex, label, exercises: exercises.slice(0, count + 1) };
  });

  return { generatedAt: todayISO(), frequency: freq, duration: profile.duration || 30, days };
}

function getNextPlanDay(plan, workoutHistory) {
  if (!plan || !plan.days.length) return null;
  const idx = workoutHistory.length % plan.days.length;
  return plan.days[idx];
}

function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || Store.getCustomExercises().find((e) => e.id === id);
}

function allExercisesIncludingCustom() {
  return EXERCISES.concat(Store.getCustomExercises());
}
