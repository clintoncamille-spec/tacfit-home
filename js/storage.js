// All persistence is local-only (localStorage) — the app never talks to a network.
const DB_KEY = "tacfit_v1";

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return defaultDB();
    const parsed = JSON.parse(raw);
    return { ...defaultDB(), ...parsed };
  } catch (e) {
    return defaultDB();
  }
}

function defaultDB() {
  return {
    profile: null,          // see PROFILE shape below, set during onboarding
    weightLog: [],          // [{date, weightKg}]
    testLog: [],            // [{date, pushups, pullups}]
    workoutHistory: [],     // [{date, planDayId, exerciseResults:[{exerciseId,setsDone,setsPrescribed}], durationMin, completionPct}]
    currentPlan: null,      // generated weekly plan, regenerated when profile changes
    activeSession: null,    // in-progress workout session state, so a refresh doesn't lose progress
    workoutTemplates: [],   // [{id, name, exercises:[{exerciseId,sets,reps}], createdAt, updatedAt}]
    progressPhotos: [],     // [{id, date, storagePath, createdAt}] — metadata only, image bytes live in Supabase Storage
    customExercises: [],    // [{id, name, category, pose, targets, avoidInjuries, isHold, scale, steps}] — user-added, local-only
  };
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

const Store = {
  get: loadDB,
  save: saveDB,

  getProfile() { return loadDB().profile; },
  saveProfile(profile) {
    const db = loadDB();
    db.profile = profile;
    saveDB(db);
    if (typeof Sync !== "undefined") Sync.schedulePush();
  },

  logWeight(weightKg, date) {
    const db = loadDB();
    db.weightLog.push({ date: date || todayISO(), weightKg });
    db.weightLog.sort((a, b) => a.date.localeCompare(b.date));
    saveDB(db);
    if (typeof Sync !== "undefined") Sync.schedulePush();
  },

  logTest(pushups, pullups, date) {
    const db = loadDB();
    db.testLog.push({ date: date || todayISO(), pushups, pullups });
    db.testLog.sort((a, b) => a.date.localeCompare(b.date));
    saveDB(db);
    if (typeof Sync !== "undefined") Sync.schedulePush();
  },

  savePlan(plan) {
    const db = loadDB();
    db.currentPlan = plan;
    saveDB(db);
  },

  saveSession(session) {
    const db = loadDB();
    db.activeSession = session;
    saveDB(db);
  },

  clearSession() {
    const db = loadDB();
    db.activeSession = null;
    saveDB(db);
  },

  completeWorkout(entry) {
    const db = loadDB();
    db.workoutHistory.push(entry);
    db.activeSession = null;
    saveDB(db);
    if (typeof Sync !== "undefined") Sync.schedulePush();
  },

  resetAll() {
    localStorage.removeItem(DB_KEY);
  },

  // Local-only, deliberately not synced (see supabase/schema.sql note) — same tier as
  // currentPlan/activeSession.
  getTemplates() { return loadDB().workoutTemplates; },

  saveTemplate(template) {
    const db = loadDB();
    const idx = db.workoutTemplates.findIndex((t) => t.id === template.id);
    if (idx >= 0) db.workoutTemplates[idx] = template;
    else db.workoutTemplates.push(template);
    saveDB(db);
  },

  deleteTemplate(id) {
    const db = loadDB();
    db.workoutTemplates = db.workoutTemplates.filter((t) => t.id !== id);
    saveDB(db);
  },

  // Requires an account — the image bytes live in Supabase Storage, only the pointer is local.
  getProgressPhotos() { return loadDB().progressPhotos; },

  addProgressPhoto(photo) {
    const db = loadDB();
    db.progressPhotos.push(photo);
    db.progressPhotos.sort((a, b) => a.date.localeCompare(b.date));
    saveDB(db);
    if (typeof Sync !== "undefined") Sync.schedulePush();
  },

  deleteProgressPhoto(id) {
    const db = loadDB();
    db.progressPhotos = db.progressPhotos.filter((p) => p.id !== id);
    saveDB(db);
    if (typeof Sync !== "undefined") Sync.schedulePush();
  },

  // Local-only, same tier as workoutTemplates — not fed into the automatic plan generator,
  // only available for manual browsing (Library) and template-building.
  getCustomExercises() { return loadDB().customExercises; },

  addCustomExercise(exercise) {
    const db = loadDB();
    db.customExercises.push(exercise);
    saveDB(db);
  },
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(isoA, isoB) {
  const a = new Date(isoA), b = new Date(isoB);
  return Math.round((b - a) / 86400000);
}
