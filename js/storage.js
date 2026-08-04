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
  },

  logWeight(weightKg, date) {
    const db = loadDB();
    db.weightLog.push({ date: date || todayISO(), weightKg });
    db.weightLog.sort((a, b) => a.date.localeCompare(b.date));
    saveDB(db);
  },

  logTest(pushups, pullups, date) {
    const db = loadDB();
    db.testLog.push({ date: date || todayISO(), pushups, pullups });
    db.testLog.sort((a, b) => a.date.localeCompare(b.date));
    saveDB(db);
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
  },

  resetAll() {
    localStorage.removeItem(DB_KEY);
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
