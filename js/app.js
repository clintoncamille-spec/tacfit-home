// TacFit Home — app shell, router and views. Vanilla JS, no build step, fully offline.
"use strict";

const App = { root: null, draft: {}, step: 0, restTimer: null };

document.addEventListener("DOMContentLoaded", () => {
  App.root = document.getElementById("app");
  window.addEventListener("hashchange", render);
  render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});

function route() {
  const h = location.hash.replace(/^#\/?/, "");
  return h || "dashboard";
}

function go(path) { location.hash = "#/" + path; }

function render() {
  const profile = Store.getProfile();
  const r = route();
  if (!profile && r !== "onboarding") { go("onboarding"); return; }

  if (r === "onboarding") return renderOnboarding();
  if (r === "session") return renderSession();

  // all other routes share the tab-bar chrome
  App.root.innerHTML = `<div class="screen" id="screen"></div>${navBarHTML(r)}`;
  const screen = document.getElementById("screen");
  if (r === "dashboard") renderDashboard(screen);
  else if (r === "library") renderLibrary(screen);
  else if (r === "analytics") renderAnalytics(screen);
  else if (r === "settings") renderSettings(screen);
  else renderDashboard(screen);
}

function navBarHTML(active) {
  const items = [
    { id: "dashboard", label: "Home", icon: iconHome },
    { id: "library", label: "Exercises", icon: iconDumbbell },
    { id: "analytics", label: "Progress", icon: iconChart },
    { id: "settings", label: "Profile", icon: iconPerson },
  ];
  return `<nav class="tabbar">${items
    .map((it) => `<button class="tab ${active === it.id ? "active" : ""}" onclick="go('${it.id}')">${it.icon}<span>${it.label}</span></button>`)
    .join("")}</nav>`;
}

const iconHome = `<svg viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10.5V20h12v-9.5" /></svg>`;
const iconDumbbell = `<svg viewBox="0 0 24 24"><path d="M3 12h2M19 12h2M6 8v8M18 8v8M6 12h12" /></svg>`;
const iconChart = `<svg viewBox="0 0 24 24"><path d="M4 20V10M11 20V4M18 20v-7" /></svg>`;
const iconPerson = `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4.5 5-6 8-6s6.5 1.5 8 6"/></svg>`;

// ---------- Onboarding ----------

const GOAL_OPTIONS = [
  ["lose_fat", "Lose Fat / Weight"],
  ["build_muscle", "Build Muscle"],
  ["endurance", "Improve Endurance"],
  ["tone", "Get Toned / Lean"],
  ["general", "General Health"],
];
const BODY_TYPES = [
  ["ectomorph", "Ectomorph", "Lean, hard to gain weight"],
  ["mesomorph", "Mesomorph", "Athletic, gains/loses evenly"],
  ["endomorph", "Endomorph", "Broader build, gains weight easily"],
];
const BODY_GOALS = [
  ["lean_toned", "Lean & Toned"],
  ["athletic", "Athletic & Muscular"],
  ["bulk", "Bigger / More Mass"],
  ["healthier", "Just Healthier"],
];
const EXPERIENCE_OPTIONS = [
  ["beginner", "Beginner", "New to structured training"],
  ["intermediate", "Some Experience", "Trained on and off"],
  ["advanced", "Very Experienced", "Prior military / athlete"],
];
const LAST_SHAPE_OPTIONS = [
  ["lt6m", "Less than 6 months ago"],
  ["6to12m", "6–12 months ago"],
  ["1to2y", "1–2 years ago"],
  ["2to5y", "2–5 years ago"],
  ["5plus", "5+ years ago"],
  ["never", "Never really been"],
];
const WEIGHT_PATTERN_OPTIONS = [
  ["yoyo", "Yo-yo — up and down"],
  ["steady_gain", "Steady gain over time"],
  ["steady_loss", "Steady loss over time"],
  ["stable", "Pretty stable"],
  ["recent_gain", "Rapid gain recently"],
];
const DELAY_REASONS = [
  ["injury", "Injury"],
  ["time", "No time"],
  ["motivation", "Motivation"],
  ["work_stress", "Work stress"],
  ["family", "Family obligations"],
  ["health", "Health condition"],
  ["other", "Other"],
];

function onboardingSteps() {
  return [stepBasics, stepBodyGoals, stepAreasInjuries, stepHistory, stepStrength, stepSchedule, stepReview];
}

function renderOnboarding() {
  if (!App.draft || Object.keys(App.draft).length === 0) {
    const existing = Store.getProfile();
    App.draft = existing ? { ...existing } : { units: "imperial", injuries: [], problemAreas: [], delayReasons: [] };
  }
  const steps = onboardingSteps();
  const idx = Math.min(App.step, steps.length - 1);
  const dots = steps.map((_, i) => `<span class="dot ${i <= idx ? "on" : ""}"></span>`).join("");
  App.root.innerHTML = `
    <div class="onboarding">
      <div class="onb-progress">${dots}</div>
      <div class="onb-body">${steps[idx]()}</div>
    </div>`;
  bindStepEvents(idx);
}

function onbNav(idx, total) {
  return `<div class="onb-nav">
    ${idx > 0 ? `<button class="btn btn-secondary" data-nav="back">Back</button>` : `<span></span>`}
    <button class="btn btn-primary" data-nav="next">${idx === total - 1 ? "Create My Plan" : "Continue"}</button>
  </div>`;
}

function stepBasics() {
  const d = App.draft;
  return `
    <h2>The Basics</h2>
    <p class="onb-sub">So we can tailor everything to you.</p>
    <label class="field-label">Name</label>
    <input class="input" data-field="name" type="text" value="${d.name || ""}" placeholder="Your name">

    <label class="field-label">Age Range</label>
    <select class="input" data-field="ageRange">
      <option value="">Select…</option>
      ${["18-24", "25-34", "35-44", "45-54", "55-64", "65+"].map((a) => `<option value="${a}" ${d.ageRange === a ? "selected" : ""}>${a}</option>`).join("")}
    </select>

    <label class="field-label">Units</label>
    <div class="segmented" data-field="units">
      <button class="seg ${d.units !== "metric" ? "on" : ""}" data-val="imperial">Imperial (ft/in, lb)</button>
      <button class="seg ${d.units === "metric" ? "on" : ""}" data-val="metric">Metric (cm, kg)</button>
    </div>

    <div class="row2" id="height-imperial" style="${d.units === "metric" ? "display:none" : ""}">
      <div><label class="field-label">Height (ft)</label><input class="input" data-field="heightFt" type="number" min="3" max="8" value="${d.heightFt || ""}"></div>
      <div><label class="field-label">Height (in)</label><input class="input" data-field="heightIn" type="number" min="0" max="11" value="${d.heightIn || ""}"></div>
    </div>
    <div id="height-metric" style="${d.units === "metric" ? "" : "display:none"}">
      <label class="field-label">Height (cm)</label><input class="input" data-field="heightCmRaw" type="number" min="100" max="230" value="${d.heightCmRaw || ""}">
    </div>

    <label class="field-label">Weight (${d.units === "metric" ? "kg" : "lb"})</label>
    <input class="input" data-field="weightRaw" type="number" min="1" value="${d.weightRaw || ""}">

    ${onbNav(0, onboardingSteps().length)}
  `;
}

function optionCards(field, options, current, multi) {
  return `<div class="option-grid" data-field="${field}" data-multi="${multi ? "1" : "0"}">
    ${options.map(([val, label, sub]) => `
      <button class="option-card ${multi ? (current || []).includes(val) ? "on" : "" : current === val ? "on" : ""}" data-val="${val}">
        <span class="opt-label">${label}</span>${sub ? `<span class="opt-sub">${sub}</span>` : ""}
      </button>`).join("")}
  </div>`;
}

function stepBodyGoals() {
  const d = App.draft;
  return `
    <h2>Body & Goals</h2>
    <label class="field-label">Body Type</label>
    ${optionCards("bodyType", BODY_TYPES, d.bodyType, false)}
    <label class="field-label">Body Type Goal</label>
    ${optionCards("bodyGoal", BODY_GOALS, d.bodyGoal, false)}
    <label class="field-label">Primary Goal</label>
    ${optionCards("primaryGoal", GOAL_OPTIONS, d.primaryGoal, false)}
    <label class="field-label">Weight loss target (optional, ${d.units === "metric" ? "kg" : "lb"})</label>
    <input class="input" data-field="targetLossRaw" type="number" min="0" value="${d.targetLossRaw || ""}" placeholder="e.g. 20">
    ${onbNav(1, onboardingSteps().length)}
  `;
}

function stepAreasInjuries() {
  const d = App.draft;
  const areaOpts = Object.entries(PROBLEM_AREA_LABELS).map(([k, v]) => [k, v]);
  const injuryOpts = Object.entries(INJURY_LABELS).map(([k, v]) => [k, v]);
  return `
    <h2>Problem Areas & Injuries</h2>
    <p class="onb-sub">Pick everything that applies — this shapes which exercises we pick.</p>
    <label class="field-label">Areas you want to work on</label>
    ${optionCards("problemAreas", areaOpts, d.problemAreas, true)}
    <label class="field-label">Any injuries or trouble areas?</label>
    ${optionCards("injuries", injuryOpts, d.injuries, true)}
    <p class="onb-hint">We'll automatically avoid exercises that stress these areas.</p>
    ${onbNav(2, onboardingSteps().length)}
  `;
}

function stepHistory() {
  const d = App.draft;
  return `
    <h2>Training History</h2>
    <label class="field-label">Workout Experience</label>
    ${optionCards("experience", EXPERIENCE_OPTIONS, d.experience, false)}
    <label class="field-label">When were you last in your best shape?</label>
    ${optionCards("lastBestShape", LAST_SHAPE_OPTIONS, d.lastBestShape, false)}
    <label class="field-label">How does your weight typically change over time?</label>
    ${optionCards("weightPattern", WEIGHT_PATTERN_OPTIONS, d.weightPattern, false)}
    <label class="field-label">What's delayed getting back in shape?</label>
    ${optionCards("delayReasons", DELAY_REASONS, d.delayReasons, true)}
    ${onbNav(3, onboardingSteps().length)}
  `;
}

function stepStrength() {
  const d = App.draft;
  return `
    <h2>Current Strength</h2>
    <p class="onb-sub">Max reps in a single round, right now (best guess is fine).</p>
    <label class="field-label">Push-ups (max, one round)</label>
    <input class="input" data-field="pushupsMax" type="number" min="0" value="${d.pushupsMax ?? ""}">
    <label class="field-label">Pull-ups (max, one round)</label>
    <input class="input" data-field="pullupsMax" type="number" min="0" value="${d.pullupsMax ?? ""}">
    ${onbNav(4, onboardingSteps().length)}
  `;
}

function stepSchedule() {
  const d = App.draft;
  return `
    <h2>Schedule</h2>
    <label class="field-label">Current workout frequency (days/week)</label>
    <select class="input" data-field="currentFrequency">
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${d.currentFrequency == n ? "selected" : ""}>${n}</option>`).join("")}
    </select>
    <label class="field-label">Prescribed frequency you want to aim for (days/week)</label>
    <select class="input" data-field="prescribedFrequency">
      ${[2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${d.prescribedFrequency == n ? "selected" : ""}>${n}</option>`).join("")}
    </select>
    <label class="field-label">Workout duration</label>
    <select class="input" data-field="duration">
      ${[15, 20, 30, 45, 60].map((n) => `<option value="${n}" ${d.duration == n ? "selected" : ""}>${n} minutes</option>`).join("")}
    </select>
    <label class="field-label">Preferred time of day</label>
    ${optionCards("timeOfDay", [["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"], ["flexible", "Flexible"]], d.timeOfDay, false)}
    ${onbNav(5, onboardingSteps().length)}
  `;
}

function stepReview() {
  const d = normalizeDraft(App.draft);
  const bmi = computeBMI(d.weightKg, d.heightCm);
  const cat = bmiCategory(bmi);
  return `
    <h2>Ready, ${escapeHtml(d.name) || "Recruit"}</h2>
    <p class="onb-sub">Here's the snapshot we'll build your plan from.</p>
    <div class="review-grid">
      <div class="review-item"><span>BMI</span><b>${bmi ? bmi.toFixed(1) : "—"} <small>(${cat.label})</small></b></div>
      <div class="review-item"><span>Experience</span><b>${labelFor(EXPERIENCE_OPTIONS, d.experience)}</b></div>
      <div class="review-item"><span>Frequency</span><b>${d.prescribedFrequency}x / week, ${d.duration} min</b></div>
      <div class="review-item"><span>Push-ups / Pull-ups</span><b>${d.pushupsMax ?? 0} / ${d.pullupsMax ?? 0}</b></div>
      <div class="review-item"><span>Focus Areas</span><b>${(d.problemAreas || []).map((a) => PROBLEM_AREA_LABELS[a]).join(", ") || "General"}</b></div>
      <div class="review-item"><span>Avoiding</span><b>${(d.injuries || []).map((a) => INJURY_LABELS[a]).join(", ") || "None"}</b></div>
    </div>
    ${onbNav(6, onboardingSteps().length)}
  `;
}

function labelFor(options, val) {
  const f = options.find((o) => o[0] === val);
  return f ? f[1] : "—";
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function normalizeDraft(d) {
  const units = d.units || "imperial";
  let heightCm = d.heightCm;
  if (units === "metric") heightCm = Number(d.heightCmRaw) || d.heightCm;
  else heightCm = feetInToCm(Number(d.heightFt) || 0, Number(d.heightIn) || 0);
  let weightKg = units === "metric" ? Number(d.weightRaw) : lbToKg(Number(d.weightRaw));
  if (!weightKg) weightKg = d.weightKg;
  return { ...d, heightCm, weightKg };
}

function feetInToCm(ft, inch) { return (ft * 12 + inch) * 2.54; }
function cmToFeetIn(cm) { const totalIn = cm / 2.54; const ft = Math.floor(totalIn / 12); return { ft, inch: Math.round(totalIn - ft * 12) }; }
function lbToKg(lb) { return lb * 0.453592; }
function kgToLb(kg) { return kg / 0.453592; }

function bindStepEvents(idx) {
  const body = document.querySelector(".onb-body");

  body.querySelectorAll("[data-field]").forEach((el) => {
    if (el.classList.contains("option-grid") || el.classList.contains("segmented")) return;
    el.addEventListener("input", () => { App.draft[el.dataset.field] = el.value; });
  });

  body.querySelectorAll(".segmented").forEach((seg) => {
    seg.querySelectorAll(".seg").forEach((btn) => {
      btn.addEventListener("click", () => {
        App.draft[seg.dataset.field] = btn.dataset.val;
        renderOnboarding();
      });
    });
  });

  body.querySelectorAll(".option-grid").forEach((grid) => {
    const field = grid.dataset.field, multi = grid.dataset.multi === "1";
    grid.querySelectorAll(".option-card").forEach((card) => {
      card.addEventListener("click", () => {
        const val = card.dataset.val;
        if (multi) {
          const arr = new Set(App.draft[field] || []);
          arr.has(val) ? arr.delete(val) : arr.add(val);
          App.draft[field] = Array.from(arr);
        } else {
          App.draft[field] = val;
        }
        renderOnboarding();
      });
    });
  });

  const nav = body.querySelector(".onb-nav");
  nav.querySelector('[data-nav="next"]').addEventListener("click", () => {
    const steps = onboardingSteps();
    if (idx === steps.length - 1) { finishOnboarding(); return; }
    App.step = idx + 1;
    renderOnboarding();
  });
  const back = nav.querySelector('[data-nav="back"]');
  if (back) back.addEventListener("click", () => { App.step = idx - 1; renderOnboarding(); });
}

function finishOnboarding() {
  const profile = normalizeDraft(App.draft);
  profile.currentFrequency = Number(profile.currentFrequency) || 0;
  profile.prescribedFrequency = Number(profile.prescribedFrequency) || 3;
  profile.duration = Number(profile.duration) || 30;
  profile.pushupsMax = Number(profile.pushupsMax) || 0;
  profile.pullupsMax = Number(profile.pullupsMax) || 0;
  profile.updatedAt = todayISO();
  Store.saveProfile(profile);
  Store.logWeight(profile.weightKg);
  Store.logTest(profile.pushupsMax, profile.pullupsMax);
  const plan = buildWeeklyPlan(profile);
  Store.savePlan(plan);
  App.draft = {}; App.step = 0;
  go("dashboard");
}

// ---------- Dashboard ----------

function renderDashboard(screen) {
  const db = Store.get();
  const profile = db.profile;
  let plan = db.currentPlan || buildWeeklyPlan(profile);
  const day = getNextPlanDay(plan, db.workoutHistory);
  const bmi = computeBMI(profile.weightKg, profile.heightCm);
  const cat = bmiCategory(bmi);
  const streak = computeStreak(db.workoutHistory);
  const thisWeekCount = countThisWeek(db.workoutHistory);
  const resumable = !!db.activeSession;

  screen.innerHTML = `
    <div class="header">
      <h1>Welcome back${profile.name ? ", " + escapeHtml(profile.name) : ""}</h1>
      <p class="muted">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
    </div>

    <div class="stat-row">
      <div class="stat-tile"><span class="stat-num">${streak}</span><span class="stat-label">Day Streak</span></div>
      <div class="stat-tile"><span class="stat-num">${thisWeekCount}/${profile.prescribedFrequency}</span><span class="stat-label">This Week</span></div>
      <div class="stat-tile"><span class="stat-num">${bmi ? bmi.toFixed(1) : "—"}</span><span class="stat-label">${cat.label}</span></div>
    </div>

    <div class="card plan-card">
      <div class="plan-card-head">
        <div>
          <div class="eyebrow">${resumable ? "Resume Workout" : "Today's Plan"}</div>
          <h2>${day ? day.label : "Rest Day"}</h2>
        </div>
        <div class="plan-meta">${day ? day.exercises.length + " exercises · ~" + profile.duration + " min" : ""}</div>
      </div>
      ${day ? `<div class="chip-row">${day.exercises.slice(0, 6).map((ex) => `<span class="chip">${exerciseById(ex.exerciseId).name}</span>`).join("")}</div>` : `<p class="muted">No plan yet — check your Profile to set a frequency.</p>`}
      ${day ? `<button class="btn btn-primary btn-block" onclick="startWorkout(${day.dayIndex})">${resumable ? "Resume Workout" : "Start Workout"}</button>` : ""}
    </div>

    <div class="card">
      <div class="eyebrow">Fitness vs BMI</div>
      <p>${fitnessVsBmiInsight(bmi, fitnessScore(latestTest(db).pushups, latestTest(db).pullups))}</p>
    </div>
  `;
}

function latestTest(db) {
  const t = db.testLog[db.testLog.length - 1];
  return t || { pushups: 0, pullups: 0 };
}

function computeStreak(history) {
  if (!history.length) return 0;
  const dates = Array.from(new Set(history.map((h) => h.date))).sort().reverse();
  let streak = 0;
  let cursor = todayISO();
  for (const d of dates) {
    const diff = daysBetween(d, cursor);
    if (diff === 0 || diff === 1) { streak++; cursor = d; } else break;
  }
  return streak;
}

function countThisWeek(history) {
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  const startISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  return history.filter((h) => h.date >= startISO).length;
}

// ---------- Workout Session ----------

function startWorkout(dayIndex) {
  const db = Store.get();
  const plan = db.currentPlan;
  const day = plan.days[dayIndex];
  const session = db.activeSession && db.activeSession.dayIndex === dayIndex ? db.activeSession : {
    dayIndex,
    startedAt: Date.now(),
    exercises: day.exercises.map((ex) => ({ exerciseId: ex.exerciseId, sets: ex.sets, reps: ex.reps, done: new Array(ex.sets).fill(false) })),
  };
  Store.saveSession(session);
  go("session");
}

function renderSession() {
  const db = Store.get();
  const session = db.activeSession;
  if (!session) { go("dashboard"); return; }
  const totalSets = session.exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = session.exercises.reduce((s, e) => s + e.done.filter(Boolean).length, 0);
  const pct = Math.round((doneSets / totalSets) * 100);

  App.root.innerHTML = `
    <div class="screen session-screen">
      <div class="session-head">
        <button class="btn-icon" onclick="exitSession()">&larr;</button>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span class="muted">${pct}%</span>
      </div>
      <div id="rest-banner"></div>
      <div class="exercise-list">
        ${session.exercises.map((se, i) => sessionExerciseCard(se, i)).join("")}
      </div>
      <button class="btn btn-primary btn-block finish-btn" onclick="finishWorkout()">Finish Workout</button>
    </div>
  `;
}

function sessionExerciseCard(se, i) {
  const ex = exerciseById(se.exerciseId);
  const allDone = se.done.every(Boolean);
  return `
    <div class="card ex-card ${allDone ? "complete" : ""}">
      <div class="ex-card-head">
        <div class="ex-pose">${POSES[ex.pose]}</div>
        <div>
          <h3>${ex.name}</h3>
          <p class="muted">${se.sets} sets × ${se.reps}${ex.isHold ? " sec" : " reps"}</p>
        </div>
      </div>
      <details class="ex-steps"><summary>How to</summary><ol>${ex.steps.map((s) => `<li>${s}</li>`).join("")}</ol></details>
      <div class="set-row">
        ${se.done.map((d, si) => `<button class="set-check ${d ? "on" : ""}" onclick="toggleSet(${i},${si})">Set ${si + 1}</button>`).join("")}
      </div>
    </div>
  `;
}

function toggleSet(exIdx, setIdx) {
  const db = Store.get();
  const session = db.activeSession;
  const se = session.exercises[exIdx];
  se.done[setIdx] = !se.done[setIdx];
  Store.saveSession(session);
  renderSession();
  if (se.done[setIdx] && !se.done.every(Boolean)) startRestBanner();
}

function startRestBanner() {
  clearInterval(App.restTimer);
  let secs = 30;
  const banner = document.getElementById("rest-banner");
  if (!banner) return;
  const tick = () => {
    if (!document.getElementById("rest-banner")) { clearInterval(App.restTimer); return; }
    document.getElementById("rest-banner").innerHTML = secs > 0 ? `<div class="rest-banner">Rest — ${secs}s</div>` : "";
    if (secs <= 0) clearInterval(App.restTimer);
    secs--;
  };
  tick();
  App.restTimer = setInterval(tick, 1000);
}

function exitSession() {
  clearInterval(App.restTimer);
  go("dashboard");
}

function finishWorkout() {
  clearInterval(App.restTimer);
  const db = Store.get();
  const session = db.activeSession;
  const totalSets = session.exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = session.exercises.reduce((s, e) => s + e.done.filter(Boolean).length, 0);
  const completionPct = Math.round((doneSets / totalSets) * 100);
  const durationMin = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000));
  Store.completeWorkout({
    date: todayISO(),
    dayIndex: session.dayIndex,
    exerciseResults: session.exercises.map((e) => ({ exerciseId: e.exerciseId, setsDone: e.done.filter(Boolean).length, setsPrescribed: e.sets })),
    durationMin, completionPct,
  });
  go("dashboard");
}

// ---------- Library ----------

function renderLibrary(screen) {
  const profile = Store.getProfile();
  screen.innerHTML = `
    <div class="header"><h1>Exercise Library</h1></div>
    <div class="chip-filter" id="lib-filter">
      ${["all", "upper", "lower", "core", "cardio", "safe"].map((c) => `<button class="chip-toggle ${c === "all" ? "on" : ""}" data-cat="${c}">${c === "safe" ? "Injury-Safe" : c === "all" ? "All" : CATEGORY_LABELS[c]}</button>`).join("")}
    </div>
    <div class="lib-list" id="lib-list"></div>
  `;
  const list = document.getElementById("lib-list");
  const filterBar = document.getElementById("lib-filter");
  function draw(cat) {
    let items = EXERCISES;
    if (cat === "safe") items = items.filter((e) => safeForProfile(e, profile));
    else if (cat !== "all") items = items.filter((e) => e.category === cat);
    list.innerHTML = items.map((ex) => `
      <div class="card lib-item">
        <div class="ex-pose small">${POSES[ex.pose]}</div>
        <div class="lib-item-body">
          <h3>${ex.name}</h3>
          <p class="muted">${CATEGORY_LABELS[ex.category]} · targets ${(ex.targets || []).map((t) => PROBLEM_AREA_LABELS[t] || t).join(", ")}</p>
          ${ex.avoidInjuries.length ? `<p class="muted small">Avoid if: ${ex.avoidInjuries.map((a) => INJURY_LABELS[a]).join(", ")}</p>` : ""}
        </div>
      </div>`).join("");
  }
  filterBar.querySelectorAll(".chip-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBar.querySelectorAll(".chip-toggle").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      draw(btn.dataset.cat);
    });
  });
  draw("all");
}

// ---------- Analytics ----------

function renderAnalytics(screen) {
  const db = Store.get();
  const profile = db.profile;
  const bmi = computeBMI(profile.weightKg, profile.heightCm);
  const cat = bmiCategory(bmi);
  const latest = latestTest(db);
  const fit = fitnessScore(latest.pushups, latest.pullups);

  screen.innerHTML = `
    <div class="header"><h1>Progress</h1></div>

    <div class="card">
      <div class="eyebrow">Weight Trend</div>
      <canvas id="chart-weight" class="chart"></canvas>
    </div>

    <div class="card">
      <div class="eyebrow">BMI</div>
      <div class="big-metric">${bmi ? bmi.toFixed(1) : "—"} <span class="tag tag-${cat.tone}">${cat.label}</span></div>
    </div>

    <div class="card">
      <div class="eyebrow">Fitness Level</div>
      <div class="two-col">
        <div><span class="stat-num">${latest.pushups}</span><span class="stat-label">Push-ups (${fit.pushupLevel})</span></div>
        <div><span class="stat-num">${latest.pullups}</span><span class="stat-label">Pull-ups (${fit.pullupLevel})</span></div>
      </div>
      <p class="muted">${fitnessVsBmiInsight(bmi, fit)}</p>
      <button class="btn btn-secondary btn-block" id="log-test-btn">Log New Test</button>
      <div id="test-form"></div>
    </div>

    <div class="card">
      <div class="eyebrow">Push-up / Pull-up Progression</div>
      <canvas id="chart-strength" class="chart"></canvas>
    </div>

    <div class="card">
      <div class="eyebrow">Workout Frequency — Current vs Prescribed</div>
      <canvas id="chart-freq" class="chart"></canvas>
    </div>

    <div class="card">
      <div class="eyebrow">Recent Workouts</div>
      ${db.workoutHistory.slice().reverse().slice(0, 8).map((w) => `
        <div class="history-row"><span>${w.date}</span><span>${w.durationMin} min</span><span>${w.completionPct}%</span></div>
      `).join("") || `<p class="muted">No workouts logged yet.</p>`}
    </div>
  `;

  const weightPoints = db.weightLog.map((w) => ({ y: profile.units === "metric" ? w.weightKg : kgToLb(w.weightKg) }));
  drawLineChart(document.getElementById("chart-weight"), weightPoints, { emptyText: "Log weight to see your trend" });

  const strengthCanvas = document.getElementById("chart-strength");
  const pushPoints = db.testLog.map((t) => ({ y: t.pushups }));
  drawLineChart(strengthCanvas, pushPoints, { emptyText: "No strength tests yet", minY: 0 });

  drawBarChart(document.getElementById("chart-freq"), [
    { label: "Current", v: profile.currentFrequency || 0 },
    { label: "This Week", v: countThisWeek(db.workoutHistory) },
    { label: "Goal", v: profile.prescribedFrequency || 0 },
  ]);

  document.getElementById("log-test-btn").addEventListener("click", () => {
    document.getElementById("test-form").innerHTML = `
      <div class="row2">
        <input class="input" id="new-pushups" type="number" placeholder="Push-ups">
        <input class="input" id="new-pullups" type="number" placeholder="Pull-ups">
      </div>
      <button class="btn btn-primary btn-block" id="save-test-btn">Save Test</button>
    `;
    document.getElementById("save-test-btn").addEventListener("click", () => {
      const pu = Number(document.getElementById("new-pushups").value) || 0;
      const pl = Number(document.getElementById("new-pullups").value) || 0;
      Store.logTest(pu, pl);
      renderAnalytics(screen);
    });
  });
}

// ---------- Settings ----------

function renderSettings(screen) {
  const profile = Store.getProfile();
  screen.innerHTML = `
    <div class="header"><h1>Profile & Settings</h1></div>
    <div class="card">
      <div class="review-grid">
        <div class="review-item"><span>Name</span><b>${escapeHtml(profile.name) || "—"}</b></div>
        <div class="review-item"><span>Age Range</span><b>${profile.ageRange || "—"}</b></div>
        <div class="review-item"><span>Body Type</span><b>${labelFor(BODY_TYPES, profile.bodyType)}</b></div>
        <div class="review-item"><span>Goal</span><b>${labelFor(GOAL_OPTIONS, profile.primaryGoal)}</b></div>
        <div class="review-item"><span>Frequency</span><b>${profile.prescribedFrequency}x/week · ${profile.duration}min</b></div>
        <div class="review-item"><span>Injuries</span><b>${(profile.injuries || []).map((a) => INJURY_LABELS[a]).join(", ") || "None"}</b></div>
      </div>
      <button class="btn btn-secondary btn-block" onclick="editProfile()">Edit Full Profile</button>
    </div>

    <div class="card">
      <div class="eyebrow">Log Today's Weight (${profile.units === "metric" ? "kg" : "lb"})</div>
      <div class="row2">
        <input class="input" id="new-weight" type="number">
        <button class="btn btn-primary" id="save-weight-btn">Save</button>
      </div>
    </div>

    <div class="card">
      <div class="eyebrow">Danger Zone</div>
      <button class="btn btn-danger btn-block" id="reset-btn">Reset All Data</button>
    </div>
  `;
  document.getElementById("save-weight-btn").addEventListener("click", () => {
    const raw = Number(document.getElementById("new-weight").value);
    if (!raw) return;
    const kg = profile.units === "metric" ? raw : lbToKg(raw);
    Store.logWeight(kg);
    profile.weightKg = kg;
    Store.saveProfile(profile);
    renderSettings(screen);
  });
  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("This clears your profile, plan and history from this device. Continue?")) {
      Store.resetAll();
      App.draft = {}; App.step = 0;
      go("onboarding");
    }
  });
}

function editProfile() {
  App.draft = { ...Store.getProfile() };
  const h = cmToFeetIn(App.draft.heightCm || 170);
  App.draft.heightFt = h.ft; App.draft.heightIn = h.inch;
  App.draft.heightCmRaw = Math.round(App.draft.heightCm || 170);
  App.draft.weightRaw = App.draft.units === "metric" ? Math.round(App.draft.weightKg) : Math.round(kgToLb(App.draft.weightKg));
  App.step = 0;
  go("onboarding");
}
