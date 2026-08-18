// TacFit Home — app shell, router and views. Vanilla JS, no build step, fully offline.
"use strict";

const App = {
  root: null, draft: {}, step: 0, user: null, templateEditing: null, templatePickerOpen: false, templatePickerCat: "all",
  restTimer: null, restAutoCloseTimer: null, restActive: false, restDone: false, restDuration: 60, restRemaining: 0, audioCtx: null,
  historyExerciseId: null,
  calendarMonthOffset: 0,
  photoLightboxId: null, photoLightboxUrl: null,
  logWeightModalOpen: false,
  customExModalOpen: false, customExerciseDraft: null,
  newBadges: null,
};

document.addEventListener("DOMContentLoaded", () => {
  App.root = document.getElementById("app");
  window.addEventListener("hashchange", render);
  render();

  if (typeof Auth !== "undefined" && Auth.isAvailable()) {
    Auth.currentUser().then((u) => {
      App.user = u;
      Sync._user = u;
      if (u) Sync.pullRemote().then(() => { if (route() !== "onboarding" && route() !== "session") render(); });
    });
    Auth.onChange((u) => {
      App.user = u;
      const screen = document.getElementById("screen");
      if (screen && route() === "settings") renderSettings(screen);
    });
    Sync.setStatusListener(() => {
      const screen = document.getElementById("screen");
      if (screen && route() === "settings") renderSettings(screen);
    });
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  const profile = Store.getProfile();
  if (profile) Notifications.sync(profile);
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
  if (r === "templates") return renderTemplates();
  if (r === "exercise-history") return renderExerciseHistory();

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
    { id: "dashboard", label: "Home", icon: "home" },
    { id: "library", label: "Exercises", icon: "dumbbell" },
    { id: "analytics", label: "Progress", icon: "bar-chart" },
    { id: "settings", label: "Profile", icon: "user-circle" },
  ];
  return `<nav class="tabbar">${items
    .map((it) => `<button class="tab ${active === it.id ? "active" : ""}" onclick="go('${it.id}')">${iconHTML(it.icon)}<span>${it.label}</span></button>`)
    .join("")}</nav>`;
}

// ---------- Icon system ----------
// One shared set of SF Symbols-influenced outline glyphs (24x24 grid, rendered at 20px/2px
// stroke via the .icon CSS class — see styles.css). Every icon in the app goes through
// iconHTML() so sizing/stroke stays uniform; nothing hand-rolls its own <svg> anymore.
const ICONS = {
  home: `<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10.5V20h12v-9.5"/>`,
  dumbbell: `<path d="M4 12h2M18 12h2M7 8v8M17 8v8M7 12h10"/>`,
  "bar-chart": `<path d="M5 20V11M12 20V4M19 20v-7"/>`,
  "user-circle": `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="10" r="2.7"/><path d="M6.5 18c1.3-3 3.4-4 5.5-4s4.2 1 5.5 4"/>`,
  scale: `<circle cx="12" cy="12" r="8.5"/><path d="M12 12 15 9"/><path d="M12 6.5v1.3M12 16.2v1.3M6.5 12h1.3M16.2 12h1.3"/>`,
  timer: `<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.6 2"/><path d="M9.5 3.5h5"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  "plus-circle": `<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>`,
  minus: `<path d="M5 12h14"/>`,
  x: `<path d="M6 6l12 12M18 6 6 18"/>`,
  check: `<path d="M5 13l4.5 4.5L19 7"/>`,
  "chevron-left": `<path d="M14.5 6 8.5 12l6 6"/>`,
  "chevron-right": `<path d="M9.5 6l6 6-6 6"/>`,
  "chevron-up": `<path d="M6 14.5 12 8.5l6 6"/>`,
  "chevron-down": `<path d="M6 9.5l6 6 6-6"/>`,
  calendar: `<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 10h16"/><path d="M8 3.5v4M16 3.5v4"/>`,
  "calendar-days": `<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 10h16"/><path d="M8 3.5v4M16 3.5v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>`,
  activity: `<path d="M3 12h4l2-7 4 14 2-7h6"/>`,
  "trending-up": `<path d="M4 17l6-6 4 4 6-8"/><path d="M14 6h6v6"/>`,
  "trending-down": `<path d="M4 7l6 6 4-4 6 8"/><path d="M20 11v6h-6"/>`,
  zap: `<path d="M13 3 6 14h5l-1 7 8-11h-5l1-7Z"/>`,
  "scale-balance": `<path d="M12 4v16M7 8h10"/><path d="M7 8 4 14a3 3 0 0 0 6 0Z"/><path d="M17 8l-3 6a3 3 0 0 0 6 0Z"/>`,
  "bar-chart-3": `<path d="M4 6h11M4 12h16M4 18h8"/>`,
  camera: `<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7l1.5-2.5h5L16 7"/><circle cx="12" cy="13.5" r="3.5"/>`,
  list: `<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>`,
  "alert-triangle": `<path d="M12 4.5 21 19.5H3Z"/><path d="M12 10v4.5M12 17h.01"/>`,
  history: `<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l3 2"/><path d="M4.5 8.5A8 8 0 0 1 8 5"/><path d="M3 4v4h4"/>`,
  "play-circle": `<circle cx="12" cy="12" r="8.5"/><path d="M10 8.5v7l6-3.5Z"/>`,
  edit: `<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"/><path d="M14.5 5.5l4 4"/>`,
  trash: `<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>`,
  download: `<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/>`,
  "log-out": `<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M15 16l5-4-5-4"/><path d="M20 12H10"/>`,
  award: `<circle cx="12" cy="8.5" r="4.5"/><path d="M9 12.5 7 20l5-3 5 3-2-7.5"/>`,
  flame: `<path d="M12 21c-3.3 0-6-2.5-6-6 0-3.8 2.6-6.4 3.8-10 .6 2.3.9 4.3 1.7 4.3.8 0 1-2.2.7-4.6C15.4 7 18 10 18 15c0 3.5-2.7 6-6 6Z"/>`,
};

function iconHTML(name) {
  return `<svg class="icon" viewBox="0 0 24 24">${ICONS[name] || ""}</svg>`;
}

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

// Editing an existing profile always gets the full step list (no mode choice —
// the whole point of "Edit Full Profile" is filling in everything). Fresh
// onboarding leads with a mode choice; the chosen path then determines the rest.
function onboardingSteps() {
  if (App.draft._editing) {
    return [stepBasics, stepBodyGoals, stepAreasInjuries, stepHistory, stepStrength, stepSchedule, stepReview];
  }
  if (App.draft._fastPath) {
    return [stepWelcomeChoice, stepQuickEssentials, stepQuickSchedule, stepReview];
  }
  return [stepWelcomeChoice, stepBasics, stepBodyGoals, stepAreasInjuries, stepHistory, stepStrength, stepSchedule, stepReview];
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
      <div class="onb-body">${steps[idx](idx)}</div>
    </div>`;
  bindStepEvents(idx);
}

function onbNav(idx, total) {
  return `<div class="onb-nav">
    ${idx > 0 ? `<button class="btn btn-secondary" data-nav="back">${iconHTML("chevron-left")}<span>Back</span></button>` : `<span></span>`}
    <button class="btn btn-primary" data-nav="next">${idx === total - 1 ? `${iconHTML("check")}<span>Create My Plan</span>` : `${iconHTML("chevron-right")}<span>Continue</span>`}</button>
  </div>`;
}

// No onbNav footer here — each option advances immediately on tap, since picking
// a path *is* the action (see bindStepEvents' nav guard for the missing-.onb-nav case).
function stepWelcomeChoice() {
  return `
    <h2>Let's Get Started</h2>
    <p class="onb-sub">Choose how you'd like to set up your plan.</p>
    <button type="button" class="card onb-mode-card" onclick="chooseOnboardingMode(true)">
      <div class="eyebrow">${iconHTML("zap")}<span>Quick Start</span></div>
      <p>Goal, injuries, and schedule — get a plan in under a minute. Fill in the rest later.</p>
    </button>
    <button type="button" class="card onb-mode-card" onclick="chooseOnboardingMode(false)">
      <div class="eyebrow">${iconHTML("award")}<span>Full Setup</span></div>
      <p>The most personalized plan — body type, training history, current strength. About 5 minutes.</p>
    </button>
  `;
}

function chooseOnboardingMode(fast) {
  App.draft._fastPath = fast;
  App.step = 1;
  renderOnboarding();
}

function stepQuickEssentials(idx) {
  const d = App.draft;
  const injuryOpts = Object.entries(INJURY_LABELS).map(([k, v]) => [k, v]);
  return `
    <h2>The Essentials</h2>
    <p class="onb-sub">Just enough to build a safe, effective plan — you can fill in the rest later.</p>
    <label class="field-label">Primary Goal</label>
    ${optionCards("primaryGoal", GOAL_OPTIONS, d.primaryGoal, false)}
    <label class="field-label">Any injuries or trouble areas?</label>
    ${optionCards("injuries", injuryOpts, d.injuries, true)}
    <p class="onb-hint">We'll automatically avoid exercises that stress these areas.</p>
    ${onbNav(idx, onboardingSteps().length)}
  `;
}

function stepQuickSchedule(idx) {
  const d = App.draft;
  return `
    <h2>Your Schedule</h2>
    <p class="onb-sub">How much time can you give this?</p>
    <label class="field-label">Days per week</label>
    <select class="input" data-field="prescribedFrequency">
      ${[2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${d.prescribedFrequency == n ? "selected" : ""}>${n}</option>`).join("")}
    </select>
    <label class="field-label">Minutes per session</label>
    <select class="input" data-field="duration">
      ${[15, 20, 30, 45, 60].map((n) => `<option value="${n}" ${d.duration == n ? "selected" : ""}>${n} minutes</option>`).join("")}
    </select>
    ${onbNav(idx, onboardingSteps().length)}
  `;
}

function stepBasics(idx) {
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

    ${onbNav(idx, onboardingSteps().length)}
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

function stepBodyGoals(idx) {
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
    ${onbNav(idx, onboardingSteps().length)}
  `;
}

function stepAreasInjuries(idx) {
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
    ${onbNav(idx, onboardingSteps().length)}
  `;
}

function stepHistory(idx) {
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
    ${onbNav(idx, onboardingSteps().length)}
  `;
}

function stepStrength(idx) {
  const d = App.draft;
  return `
    <h2>Current Strength</h2>
    <p class="onb-sub">Max reps in a single round, right now (best guess is fine).</p>
    <label class="field-label">Push-ups (max, one round)</label>
    <input class="input" data-field="pushupsMax" type="number" min="0" value="${d.pushupsMax ?? ""}">
    <label class="field-label">Pull-ups (max, one round)</label>
    <input class="input" data-field="pullupsMax" type="number" min="0" value="${d.pullupsMax ?? ""}">
    ${onbNav(idx, onboardingSteps().length)}
  `;
}

function stepSchedule(idx) {
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
    ${onbNav(idx, onboardingSteps().length)}
  `;
}

function stepReview(idx) {
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
    ${onbNav(idx, onboardingSteps().length)}
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
  if (!nav) return; // stepWelcomeChoice has no nav footer — its cards advance directly
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
  // Completing the full wizard (whether that was the original path or a later
  // "Finish Setup" edit) always clears quickStartUsed — the whole point of that
  // flag is gating the dashboard's "finish your profile" nudge, and completing
  // the full wizard is exactly what satisfies it.
  const usedQuickStart = !!App.draft._fastPath;
  const profile = normalizeDraft(App.draft);
  delete profile._fastPath;
  delete profile._editing;
  profile.quickStartUsed = usedQuickStart;
  profile.currentFrequency = Number(profile.currentFrequency) || 0;
  profile.prescribedFrequency = Number(profile.prescribedFrequency) || 3;
  profile.duration = Number(profile.duration) || 30;
  profile.pushupsMax = Number(profile.pushupsMax) || 0;
  profile.pullupsMax = Number(profile.pullupsMax) || 0;
  profile.updatedAt = todayISO();
  Store.saveProfile(profile);
  // Quick Start skips height/weight entirely — don't log a garbage undefined entry.
  if (profile.weightKg) Store.logWeight(profile.weightKg);
  Store.logTest(profile.pushupsMax, profile.pullupsMax);
  const plan = buildWeeklyPlan(profile);
  Store.savePlan(plan);
  Notifications.sync(profile);
  App.draft = {}; App.step = 0;
  go("dashboard");
}

// ---------- Dashboard ----------

function calendarHTML(workoutHistory) {
  const workoutDates = new Set(workoutHistory.map((w) => w.date));
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + App.calendarMonthOffset, 1);
  const year = base.getFullYear(), month = base.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = base.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayStr = todayISO();

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(`<div class="cal-cell cal-blank"></div>`);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const classes = ["cal-cell"];
    if (workoutDates.has(dateStr)) classes.push("cal-worked");
    if (dateStr === todayStr) classes.push("cal-today");
    cells.push(`<div class="${classes.join(" ")}"><span>${d}</span></div>`);
  }

  return `
    <div class="card">
      <div class="cal-head">
        <button class="btn-icon" onclick="shiftCalendarMonth(-1)">${iconHTML("chevron-left")}</button>
        <div class="eyebrow">${iconHTML("calendar")}<span>${monthLabel}</span></div>
        <button class="btn-icon" onclick="shiftCalendarMonth(1)">${iconHTML("chevron-right")}</button>
      </div>
      <div class="cal-weekdays">${["S", "M", "T", "W", "T", "F", "S"].map((d) => `<span>${d}</span>`).join("")}</div>
      <div class="cal-grid">${cells.join("")}</div>
    </div>`;
}

function shiftCalendarMonth(delta) {
  App.calendarMonthOffset += delta;
  const screen = document.getElementById("screen");
  if (screen) renderDashboard(screen);
}

// A short "why this plan" line promoted to the top of Today's Plan, rather than
// only the generic BMI/strength insight further down the dashboard — this one is
// specific to *today's* exercises, referencing the injuries/focus areas that
// actually shaped which moves got picked (safeForProfile/pickFromPool in
// workout-generator.js).
function planRationaleText(profile, day) {
  const injuries = profile.injuries || [];
  const problemAreas = profile.problemAreas || [];
  const dayTargets = new Set();
  for (const ex of day.exercises) {
    const meta = exerciseById(ex.exerciseId);
    (meta.targets || []).forEach((t) => dayTargets.add(t));
  }
  const focus = problemAreas.filter((p) => dayTargets.has(p)).map((p) => PROBLEM_AREA_LABELS[p]);
  const avoiding = injuries.map((i) => INJURY_LABELS[i]);
  if (avoiding.length && focus.length) return `Focused on ${focus.join(", ")} today, avoiding ${avoiding.join(", ")}.`;
  if (avoiding.length) return `Every move today avoids ${avoiding.join(", ")}, as you flagged.`;
  if (focus.length) return `Extra focus on ${focus.join(", ")} today, based on your goals.`;
  return `A well-rounded ${day.label.toLowerCase()} session, scaled to your ${profile.experience || "beginner"} level.`;
}

function renderDashboard(screen) {
  const db = Store.get();
  const profile = db.profile;
  let plan = db.currentPlan || buildWeeklyPlan(profile);
  const day = getNextPlanDay(plan, db.workoutHistory);
  const bmi = computeBMI(profile.weightKg, profile.heightCm);
  const cat = bmiCategory(bmi);
  const streak = computeStreak(db.workoutHistory);
  const thisWeekCount = countThisWeek(db.workoutHistory);
  // Only treat an in-progress session as "resuming this card" if it's actually for today's
  // plan day — a template-started session (dayIndex: null) shouldn't be conflated with it.
  const activeSessionForToday = day && db.activeSession && db.activeSession.dayIndex === day.dayIndex ? db.activeSession : null;

  screen.innerHTML = `
    <div class="header">
      <h1>Welcome back${profile.name ? ", " + escapeHtml(profile.name) : ""}</h1>
      <p class="muted">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
    </div>

    ${reminderBannerHTML(profile, db.workoutHistory)}
    ${completeProfileBannerHTML(profile)}
    ${accountBannerHTML()}

    ${quickActionToolbarHTML()}

    <div class="stat-row">
      <div class="stat-tile"><span class="stat-num">${streak}</span><span class="stat-label">Day Streak</span></div>
      <div class="stat-tile"><span class="stat-num">${thisWeekCount}/${profile.prescribedFrequency}</span><span class="stat-label">This Week</span></div>
      <div class="stat-tile"><span class="stat-num">${bmi ? bmi.toFixed(1) : "—"}</span><span class="stat-label">${cat.label}</span></div>
    </div>

    ${todaysActivityHTML(db)}

    ${calendarHTML(db.workoutHistory)}

    <div class="card plan-card">
      <div class="plan-card-head">
        <div>
          <div class="eyebrow">${iconHTML("play-circle")}<span>${activeSessionForToday ? "Resume Workout" : "Today's Plan"}</span></div>
          <h2>${day ? day.label : "Rest Day"}</h2>
          ${day ? `<p class="plan-rationale muted">${escapeHtml(planRationaleText(profile, day))}</p>` : ""}
        </div>
        <div class="plan-meta">${day ? day.exercises.length + " exercises · ~" + profile.duration + " min" : ""}</div>
      </div>
      ${day ? planChecklistHTML(day, activeSessionForToday, db.workoutHistory) : `<p class="muted">No plan yet — check your Profile to set a frequency.</p>`}
      ${day ? `<button class="btn btn-primary btn-block" onclick="startWorkout(${day.dayIndex})">${iconHTML("play-circle")}<span>${activeSessionForToday ? "Resume Workout" : "Start Workout"}</span></button>` : ""}
      <button class="btn btn-secondary btn-block" onclick="go('templates')">${iconHTML("list")}<span>Start From Template</span></button>
    </div>

    <div class="card">
      <div class="eyebrow">${iconHTML("scale-balance")}<span>Fitness vs BMI</span></div>
      <p>${fitnessVsBmiInsight(bmi, fitnessScore(latestTest(db).pushups, latestTest(db).pullups))}</p>
    </div>
    ${App.restActive ? restModalHTML() : ""}
    ${App.logWeightModalOpen ? logWeightModalHTML() : ""}
    ${App.customExModalOpen ? customExerciseModalHTML() : ""}
    ${achievementModalHTML()}
  `;
  bindDashboardModalEvents();
}

// ---------- Quick Actions (dashboard) ----------

function quickActionToolbarHTML() {
  return `
    <div class="quick-actions">
      <button class="qa-btn" onclick="openLogWeightModal()">
        <span class="qa-icon">${iconHTML("scale")}</span>
        <span class="qa-label">Log Weight</span>
      </button>
      <button class="qa-btn" onclick="startRestTimer(App.restDuration)">
        <span class="qa-icon">${iconHTML("timer")}</span>
        <span class="qa-label">Start Timer</span>
      </button>
      <button class="qa-btn" onclick="openCustomExerciseModal()">
        <span class="qa-icon">${iconHTML("plus")}</span>
        <span class="qa-label">Add Exercise</span>
      </button>
    </div>`;
}

// ---------- Today's Activity (7-day volume trend) ----------

function workoutVolume(w) {
  return (w.exerciseResults || []).reduce((sum, r) => {
    const workingSets = Math.max(0, r.setsDone - (r.warmupSetsDone || 0));
    return sum + workingSets * (r.reps || 0);
  }, 0);
}

function todaysActivityHTML(db) {
  const today = todayISO();
  const todaysWorkouts = db.workoutHistory.filter((w) => w.date === today);
  const activeMinutes = todaysWorkouts.reduce((s, w) => s + w.durationMin, 0);
  const todaysVolume = todaysWorkouts.reduce((s, w) => s + workoutVolume(w), 0);

  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayVolume = db.workoutHistory.filter((w) => w.date === iso).reduce((s, w) => s + workoutVolume(w), 0);
    trend.push(dayVolume);
  }

  return `
    <div class="card">
      <div class="eyebrow">${iconHTML("activity")}<span>Today's Activity</span></div>
      <div class="activity-metrics">
        <div class="activity-metric"><span class="stat-num">${activeMinutes}</span><span class="stat-label">Active Min</span></div>
        <div class="activity-metric"><span class="stat-num">${todaysVolume}</span><span class="stat-label">Volume</span></div>
      </div>
      <div class="trend-wrap">
        ${sparklineSVG(trend)}
        <span class="trend-label">7-Day Volume Trend</span>
      </div>
    </div>`;
}

function sparklineSVG(values) {
  const width = 280, height = 46;
  const max = Math.max(1, ...values);
  const n = values.length;
  const stepX = width / Math.max(1, n - 1);
  const points = values.map((v, i) => [
    Number((i * stepX).toFixed(1)),
    Number((height - (v / max) * (height - 6) - 3).toFixed(1)),
  ]);
  const linePath = points.map((p, i) => (i === 0 ? "M" : "L") + p[0] + "," + p[1]).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const last = points[points.length - 1];
  return `
    <svg viewBox="0 0 ${width} ${height}" class="trend-svg" preserveAspectRatio="none">
      <path d="${areaPath}" fill="var(--accent)" fill-opacity="0.16" stroke="none"></path>
      <path d="${linePath}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      <circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="var(--accent)"></circle>
    </svg>`;
}

// ---------- Today's Plan checklist ----------

function planChecklistHTML(day, activeSessionForToday, workoutHistory) {
  return `
    <div class="session-list">
      ${day.exercises.map((ex, i) => {
        const meta = exerciseById(ex.exerciseId);
        const se = activeSessionForToday ? activeSessionForToday.exercises[i] : null;
        const doneCount = se ? se.done.filter(Boolean).length : 0;
        const state = !se || doneCount === 0 ? "pending" : doneCount >= ex.sets ? "done" : "partial";
        const icon = state === "done" ? iconHTML("check") : state === "partial" ? iconHTML("minus") : "";
        // Shown target reflects the same difficulty-adjusted numbers the session will
        // actually use once started (see adjustedSetsReps in workout-generator.js), so
        // the checklist here never disagrees with what you see after tapping Start.
        const { sets, reps } = se ? { sets: se.sets, reps: se.reps } : adjustedSetsReps(ex.sets, ex.reps, ex.exerciseId, workoutHistory);
        return `
          <div class="session-row">
            <span class="session-check ${state}">${icon}</span>
            <span class="session-name">${escapeHtml(meta.name)}</span>
            <span class="session-target">${sets} × ${reps}${meta.isHold ? "s" : ""}</span>
          </div>`;
      }).join("")}
    </div>`;
}

// ---------- Log Weight (quick action) ----------

function logWeightModalHTML() {
  const profile = Store.getProfile();
  return `
    <div class="rest-modal-backdrop">
      <div class="card rest-modal">
        <div class="eyebrow">${iconHTML("scale")}<span>Log Weight</span></div>
        <label class="field-label">Weight (${profile.units === "metric" ? "kg" : "lb"})</label>
        <input class="input" id="quick-weight-input" type="number">
        <div class="auth-error" id="quick-weight-error"></div>
        <div class="row2">
          <button class="btn btn-secondary" onclick="closeLogWeightModal()">${iconHTML("x")}<span>Cancel</span></button>
          <button class="btn btn-primary" id="quick-weight-save-btn">${iconHTML("check")}<span>Save</span></button>
        </div>
      </div>
    </div>`;
}

function openLogWeightModal() {
  App.logWeightModalOpen = true;
  render();
}

function closeLogWeightModal() {
  App.logWeightModalOpen = false;
  render();
}

function saveQuickWeight() {
  const profile = Store.getProfile();
  const raw = Number(document.getElementById("quick-weight-input").value);
  const errBox = document.getElementById("quick-weight-error");
  if (!raw || raw <= 0) { errBox.textContent = "Enter a valid weight."; return; }
  const kg = profile.units === "metric" ? raw : lbToKg(raw);
  Store.logWeight(kg);
  profile.weightKg = kg;
  profile.updatedAt = todayISO();
  Store.saveProfile(profile);
  closeLogWeightModal();
}

// ---------- Add Custom Exercise (quick action) ----------

function customExerciseModalHTML() {
  const d = App.customExerciseDraft;
  return `
    <div class="rest-modal-backdrop">
      <div class="card rest-modal custom-ex-modal">
        <div class="eyebrow">${iconHTML("plus-circle")}<span>Add Custom Exercise</span></div>
        <label class="field-label">Name</label>
        <input class="input" id="custom-ex-name" type="text" placeholder="e.g. Kettlebell Swing" value="${escapeHtml(d.name)}">
        <label class="field-label">Category</label>
        <div class="chip-filter">
          ${["upper", "lower", "core", "cardio"].map((c) => `<button class="chip-toggle ${d.category === c ? "on" : ""}" onclick="setCustomExField('category','${c}')">${CATEGORY_LABELS[c]}</button>`).join("")}
        </div>
        <label class="field-label">Type</label>
        <div class="segmented">
          <button class="seg ${!d.isHold ? "on" : ""}" onclick="setCustomExField('isHold', false)">Reps</button>
          <button class="seg ${d.isHold ? "on" : ""}" onclick="setCustomExField('isHold', true)">Timed Hold</button>
        </div>
        <div class="row2">
          <div><label class="field-label">Sets</label><input class="input" id="custom-ex-sets" type="number" min="1" value="${d.sets}"></div>
          <div><label class="field-label">${d.isHold ? "Seconds" : "Reps"}</label><input class="input" id="custom-ex-reps" type="number" min="1" value="${d.reps}"></div>
        </div>
        <div class="auth-error" id="custom-ex-error"></div>
        <div class="row2">
          <button class="btn btn-secondary" onclick="closeCustomExerciseModal()">${iconHTML("x")}<span>Cancel</span></button>
          <button class="btn btn-primary" id="custom-ex-save-btn">${iconHTML("check")}<span>Save</span></button>
        </div>
      </div>
    </div>`;
}

function openCustomExerciseModal() {
  App.customExerciseDraft = { name: "", category: "upper", isHold: false, sets: 3, reps: 10 };
  App.customExModalOpen = true;
  render();
}

function closeCustomExerciseModal() {
  App.customExModalOpen = false;
  App.customExerciseDraft = null;
  render();
}

function syncCustomExDraftFromInputs() {
  const nameEl = document.getElementById("custom-ex-name");
  const setsEl = document.getElementById("custom-ex-sets");
  const repsEl = document.getElementById("custom-ex-reps");
  if (nameEl) App.customExerciseDraft.name = nameEl.value;
  if (setsEl) App.customExerciseDraft.sets = Number(setsEl.value) || App.customExerciseDraft.sets;
  if (repsEl) App.customExerciseDraft.reps = Number(repsEl.value) || App.customExerciseDraft.reps;
}

function setCustomExField(field, value) {
  syncCustomExDraftFromInputs();
  App.customExerciseDraft[field] = value;
  render();
}

function saveCustomExercise() {
  syncCustomExDraftFromInputs();
  const d = App.customExerciseDraft;
  const errBox = document.getElementById("custom-ex-error");
  if (!d.name.trim()) { errBox.textContent = "Give it a name."; return; }
  const sets = Math.max(1, Number(d.sets) || 1);
  const reps = Math.max(1, Number(d.reps) || 1);
  Store.addCustomExercise({
    id: "custom_" + crypto.randomUUID(),
    name: d.name.trim(), category: d.category, pose: "custom",
    targets: [], avoidInjuries: [], isHold: d.isHold,
    scale: { beginner: [sets, reps], intermediate: [sets, reps], advanced: [sets, reps] },
    steps: [],
  });
  closeCustomExerciseModal();
}

function bindDashboardModalEvents() {
  const saveWeightBtn = document.getElementById("quick-weight-save-btn");
  if (saveWeightBtn) saveWeightBtn.addEventListener("click", saveQuickWeight);
  const saveExBtn = document.getElementById("custom-ex-save-btn");
  if (saveExBtn) saveExBtn.addEventListener("click", saveCustomExercise);
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
  const startISO = weekStartISO();
  return history.filter((h) => h.date >= startISO).length;
}

function weekStartISO() {
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
}

const BANNER_DISMISS_KEY = "tacfit_account_banner_dismissed";

function accountBannerHTML() {
  if (typeof Auth === "undefined" || !Auth.isAvailable() || App.user || localStorage.getItem(BANNER_DISMISS_KEY)) return "";
  return `
    <div class="card account-banner">
      <p>Create a free account to sync your progress across devices.</p>
      <div class="row2">
        <button class="btn btn-secondary" onclick="dismissAccountBanner()">${iconHTML("x")}<span>Not now</span></button>
        <button class="btn btn-primary" onclick="go('settings')">${iconHTML("chevron-right")}<span>Set Up</span></button>
      </div>
    </div>`;
}

function dismissAccountBanner() {
  localStorage.setItem(BANNER_DISMISS_KEY, "1");
  render();
}

// Nudges Quick Start users toward the full wizard (body type, training history,
// current strength) for a more personalized plan. profile.quickStartUsed is
// cleared automatically the next time they complete the full wizard — see
// finishOnboarding() — so this naturally stops appearing once satisfied, on top
// of the permanent per-profile dismiss below.
const COMPLETE_PROFILE_DISMISS_KEY = "tacfit_complete_profile_dismissed";

function completeProfileBannerHTML(profile) {
  if (!profile.quickStartUsed || localStorage.getItem(COMPLETE_PROFILE_DISMISS_KEY)) return "";
  return `
    <div class="card">
      <div class="eyebrow">${iconHTML("edit")}<span>Finish Your Profile</span></div>
      <p class="muted">You used Quick Start — add your body type, training history, and current strength for a more personalized plan.</p>
      <div class="row2">
        <button class="btn btn-secondary" onclick="dismissCompleteProfileBanner()">${iconHTML("x")}<span>Later</span></button>
        <button class="btn btn-primary" onclick="editProfile()">${iconHTML("chevron-right")}<span>Finish Setup</span></button>
      </div>
    </div>`;
}

function dismissCompleteProfileBanner() {
  localStorage.setItem(COMPLETE_PROFILE_DISMISS_KEY, "1");
  render();
}

// The in-app counterpart to Notifications' native daily reminder (see
// notifications.js) — recomputed live from current streak/weekly-progress data
// every time the dashboard renders, so unlike the native notification's fixed
// daily copy, this is never stale. Dismissal is scoped to today's date so it
// comes back if still relevant tomorrow, rather than being dismissed forever.
const REMINDER_DISMISS_KEY_PREFIX = "tacfit_reminder_dismissed_";

function reminderBannerHTML(profile, workoutHistory) {
  if (profile.remindersEnabled === false) return "";
  if (localStorage.getItem(REMINDER_DISMISS_KEY_PREFIX + todayISO())) return "";
  const reminder = reminderMessage(profile, workoutHistory);
  if (!reminder) return "";
  return `
    <div class="card reminder-banner">
      <div class="eyebrow">${iconHTML("activity")}<span>${escapeHtml(reminder.title)}</span></div>
      <p>${escapeHtml(reminder.body)}</p>
      <button class="btn btn-secondary btn-block" onclick="dismissReminderBanner()">${iconHTML("x")}<span>Dismiss for Today</span></button>
    </div>`;
}

function dismissReminderBanner() {
  localStorage.setItem(REMINDER_DISMISS_KEY_PREFIX + todayISO(), "1");
  render();
}

// ---------- Workout Session ----------

function startWorkout(dayIndex) {
  const db = Store.get();
  const plan = db.currentPlan;
  const day = plan.days[dayIndex];
  const session = db.activeSession && db.activeSession.dayIndex === dayIndex ? db.activeSession : {
    dayIndex,
    startedAt: Date.now(),
    exercises: day.exercises.map((ex) => {
      const { sets, reps } = adjustedSetsReps(ex.sets, ex.reps, ex.exerciseId, db.workoutHistory);
      return { exerciseId: ex.exerciseId, sets, reps, done: new Array(sets).fill(false), warmup: new Array(sets).fill(false), difficulty: null };
    }),
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
        <button class="btn-icon" onclick="exitSession()">${iconHTML("chevron-left")}</button>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span class="muted">${pct}%</span>
      </div>
      ${warmupSuggestionsHTML(session)}
      <div class="exercise-list">
        ${session.exercises.map((se, i) => sessionExerciseCard(se, i)).join("")}
      </div>
      <button class="btn btn-primary btn-block finish-btn" onclick="finishWorkout()">${iconHTML("check")}<span>Finish Workout</span></button>
    </div>
    ${App.restActive ? restModalHTML() : ""}
  `;
}

// Bodyweight app, no external weight tracking — sets marked as warm-up still count toward
// "done" (the workout itself), they're just excluded from volume/PR calculations later.
function sessionExerciseCard(se, i) {
  const ex = exerciseById(se.exerciseId);
  const warmup = se.warmup || new Array(se.sets).fill(false);
  const allDone = se.done.every(Boolean);
  return `
    <div class="card ex-card ${allDone ? "complete" : ""}" style="animation-delay:${Math.min(i * 0.05, 0.3)}s">
      <div class="ex-card-head">
        <div class="ex-pose">${POSES[ex.pose]}${allDone ? `<span class="complete-badge">${iconHTML("check")}</span>` : ""}</div>
        <div>
          <h3>${escapeHtml(ex.name)}</h3>
          <p class="muted">${se.sets} sets × ${se.reps}${ex.isHold ? " sec" : " reps"}</p>
        </div>
      </div>
      <details class="ex-steps"><summary>How to</summary><ol>${ex.steps.map((s) => `<li>${s}</li>`).join("")}</ol></details>
      <div class="set-row">
        ${se.done.map((d, si) => `
          <div class="set-pair">
            <button class="set-check ${d ? "on" : ""} ${warmup[si] ? "warmup" : ""}" onclick="toggleSet(${i},${si})"><span class="dot-ind"></span>Set ${si + 1}</button>
            <button class="set-warmup-btn ${warmup[si] ? "on" : ""}" onclick="toggleSetWarmup(${i},${si})" title="Mark set ${si + 1} as warm-up">W</button>
          </div>
        `).join("")}
      </div>
      ${allDone ? difficultyPickerHTML(se, i) : ""}
    </div>
  `;
}

// Feeds adjustedSetsReps (workout-generator.js) — the next time this exercise is
// started, its reps nudge up or down based on the last few ratings logged here.
const DIFFICULTY_OPTIONS = [["easy", "Too Easy"], ["ok", "Just Right"], ["hard", "Too Hard"]];

function difficultyPickerHTML(se, i) {
  return `
    <div class="difficulty-row">
      <span class="muted small">How did that feel?</span>
      <div class="difficulty-btns">
        ${DIFFICULTY_OPTIONS.map(([val, label]) => `<button class="chip-toggle ${se.difficulty === val ? "on" : ""}" onclick="setDifficulty(${i}, '${val}')">${label}</button>`).join("")}
      </div>
    </div>`;
}

function setDifficulty(exIdx, value) {
  const db = Store.get();
  const session = db.activeSession;
  session.exercises[exIdx].difficulty = value;
  Store.saveSession(session);
  renderSession();
}

function toggleSet(exIdx, setIdx) {
  const db = Store.get();
  const session = db.activeSession;
  const se = session.exercises[exIdx];
  se.done[setIdx] = !se.done[setIdx];
  Store.saveSession(session);
  if (se.done[setIdx] && !se.done.every(Boolean)) startRestTimer(App.restDuration);
  else renderSession();
}

function toggleSetWarmup(exIdx, setIdx) {
  const db = Store.get();
  const session = db.activeSession;
  const se = session.exercises[exIdx];
  if (!se.warmup) se.warmup = new Array(se.sets).fill(false);
  se.warmup[setIdx] = !se.warmup[setIdx];
  Store.saveSession(session);
  renderSession();
}

const WARMUP_SUGGESTIONS = {
  upper: ["Arm circles — 10 forward, 10 backward", "Shoulder rolls", "Wall slides or band pull-aparts", "A few slow incline push-ups"],
  lower: ["Leg swings — front/back and side/side", "Bodyweight squats, slow and controlled", "Walking lunges", "Ankle circles"],
  core: ["Cat-cow stretch", "Hip circles", "Standing side bends", "Bird-dog, slow and controlled"],
  cardio: ["Light jogging in place — 1 minute", "Jumping jacks — 20 reps", "High knees — 20 reps"],
};

function warmupSuggestionsHTML(session) {
  const categories = Array.from(new Set(session.exercises.map((se) => exerciseById(se.exerciseId).category)));
  const moves = Array.from(new Set(categories.flatMap((c) => WARMUP_SUGGESTIONS[c] || [])));
  if (!moves.length) return "";
  return `
    <details class="card warmup-suggestions" open>
      <summary>Warm-Up Suggestions</summary>
      <ol>${moves.map((m) => `<li>${m}</li>`).join("")}</ol>
    </details>`;
}

// ---------- Rest Timer ----------

const REST_PRESETS = [30, 60, 90, 120];

function restModalHTML() {
  if (App.restDone) {
    return `
      <div class="rest-modal-backdrop">
        <div class="card rest-modal rest-modal-done">
          <div class="rest-modal-icon">${iconHTML("check")}</div>
          <div class="rest-modal-headline">Rest Over!</div>
          <button class="btn btn-primary btn-block" onclick="closeRestModal()">${iconHTML("chevron-right")}<span>Continue</span></button>
        </div>
      </div>`;
  }
  return `
    <div class="rest-modal-backdrop">
      <div class="card rest-modal">
        <div class="eyebrow">${iconHTML("timer")}<span>Rest</span></div>
        <div class="rest-modal-time" id="rest-modal-time">${formatBigTime(App.restRemaining)}</div>
        <div class="rest-modal-presets">
          ${REST_PRESETS.map((s) => `<button class="chip-toggle ${s === App.restDuration ? "on" : ""}" onclick="setRestDuration(${s})">${formatRestLabel(s)}</button>`).join("")}
        </div>
        <div class="rest-modal-adjust">
          <button class="btn btn-secondary" onclick="adjustRest(-15)">${iconHTML("minus")}<span>15s</span></button>
          <button class="btn btn-secondary" onclick="adjustRest(15)">${iconHTML("plus")}<span>15s</span></button>
        </div>
        <button class="btn btn-secondary btn-block" onclick="skipRest()">${iconHTML("chevron-right")}<span>Skip Rest</span></button>
      </div>
    </div>`;
}

// Rest can now be started from the Session screen (after a set) or directly from the
// Dashboard's quick-action toolbar, so every re-render here goes through the generic render()
// dispatcher rather than assuming the session route — it redraws whichever route is current.
function startRestTimer(seconds) {
  clearInterval(App.restTimer);
  clearTimeout(App.restAutoCloseTimer);
  App.restDuration = seconds;
  App.restRemaining = seconds;
  App.restActive = true;
  App.restDone = false;
  ensureAudioUnlocked();
  render();
  App.restTimer = setInterval(restTick, 1000);
}

function restTick() {
  const el = document.getElementById("rest-modal-time");
  if (!el) { clearInterval(App.restTimer); return; }
  App.restRemaining--;
  if (App.restRemaining <= 0) {
    clearInterval(App.restTimer);
    App.restDone = true;
    playRestAlert();
    render();
    App.restAutoCloseTimer = setTimeout(closeRestModal, 3000);
    return;
  }
  el.textContent = formatBigTime(App.restRemaining);
}

function setRestDuration(seconds) {
  startRestTimer(seconds);
}

function adjustRest(delta) {
  App.restRemaining = Math.max(5, App.restRemaining + delta);
  const el = document.getElementById("rest-modal-time");
  if (el) el.textContent = formatBigTime(App.restRemaining);
}

function skipRest() {
  clearInterval(App.restTimer);
  clearTimeout(App.restAutoCloseTimer);
  App.restActive = false;
  App.restDone = false;
  render();
}

function closeRestModal() {
  clearTimeout(App.restAutoCloseTimer);
  App.restActive = false;
  App.restDone = false;
  render();
}

function formatBigTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatRestLabel(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}:00` : `${m}:${String(s).padStart(2, "0")}`;
}

function ensureAudioUnlocked() {
  try {
    if (!App.audioCtx) App.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (App.audioCtx.state === "suspended") App.audioCtx.resume();
  } catch (e) {}
}

function playRestAlert() {
  try {
    if (!App.audioCtx) App.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = App.audioCtx;
    const beep = (delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    };
    beep(0);
    beep(0.35);
  } catch (e) {}
  if (navigator.vibrate) {
    try { navigator.vibrate([200, 100, 200]); } catch (e) {}
  }
}

function exitSession() {
  clearInterval(App.restTimer);
  clearTimeout(App.restAutoCloseTimer);
  App.restActive = false;
  App.restDone = false;
  go("dashboard");
}

function finishWorkout() {
  clearInterval(App.restTimer);
  clearTimeout(App.restAutoCloseTimer);
  App.restActive = false;
  App.restDone = false;
  const db = Store.get();
  const session = db.activeSession;
  const totalSets = session.exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = session.exercises.reduce((s, e) => s + e.done.filter(Boolean).length, 0);
  const completionPct = Math.round((doneSets / totalSets) * 100);
  const durationMin = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000));
  const historyBefore = db.workoutHistory;
  Store.completeWorkout({
    date: todayISO(),
    dayIndex: session.dayIndex,
    exerciseResults: session.exercises.map((e) => {
      const warmup = e.warmup || new Array(e.sets).fill(false);
      return {
        exerciseId: e.exerciseId,
        setsDone: e.done.filter(Boolean).length,
        setsPrescribed: e.sets,
        reps: e.reps,
        warmupSetsDone: e.done.filter((d, idx) => d && warmup[idx]).length,
        difficulty: e.difficulty || null,
      };
    }),
    durationMin, completionPct,
  });
  App.newBadges = newlyEarnedBadges(historyBefore, Store.get().workoutHistory);
  go("dashboard");
}

// ---------- Workout Templates ----------

function renderTemplates() {
  App.root.innerHTML = `<div class="screen" id="screen"></div>`;
  const screen = document.getElementById("screen");
  if (App.templateEditing) renderTemplateEditor(screen);
  else renderTemplateList(screen);
}

function renderTemplateList(screen) {
  const templates = Store.getTemplates();
  screen.innerHTML = `
    <div class="tmpl-head">
      <button class="btn-icon" onclick="go('dashboard')">${iconHTML("chevron-left")}</button>
      <h1>Templates</h1>
      <button class="btn-icon" onclick="newTemplateDraft()">${iconHTML("plus")}</button>
    </div>
    ${templates.length ? templates.map(templateCardHTML).join("") : `
      <div class="card"><p class="muted">No templates yet — create one to quick-load your favorite combos.</p></div>
    `}
  `;
}

function templateCardHTML(t) {
  return `
    <div class="card">
      <h3 class="tmpl-name">${escapeHtml(t.name)}</h3>
      <div class="chip-row">${t.exercises.map((ex) => `<span class="chip">${escapeHtml(exerciseById(ex.exerciseId).name)}</span>`).join("")}</div>
      <div class="row2">
        <button class="btn btn-secondary" onclick="editTemplate('${t.id}')">${iconHTML("edit")}<span>Edit</span></button>
        <button class="btn btn-primary" onclick="startWorkoutFromTemplate('${t.id}')">${iconHTML("play-circle")}<span>Start</span></button>
      </div>
      <button class="btn btn-danger btn-block" onclick="deleteTemplateConfirm('${t.id}')">${iconHTML("trash")}<span>Delete</span></button>
    </div>`;
}

function newTemplateDraft() {
  App.templateEditing = { id: crypto.randomUUID(), name: "", exercises: [], isNew: true };
  App.templatePickerOpen = false;
  App.templatePickerCat = "all";
  renderTemplates();
}

function editTemplate(id) {
  const t = Store.getTemplates().find((t) => t.id === id);
  if (!t) return;
  App.templateEditing = { ...t, exercises: t.exercises.map((e) => ({ ...e })) };
  App.templatePickerOpen = false;
  App.templatePickerCat = "all";
  renderTemplates();
}

function cancelTemplateEdit() {
  App.templateEditing = null;
  App.templatePickerOpen = false;
  renderTemplates();
}

function deleteTemplateConfirm(id) {
  if (confirm("Delete this template?")) {
    Store.deleteTemplate(id);
    renderTemplates();
  }
}

function renderTemplateEditor(screen) {
  const draft = App.templateEditing;
  screen.innerHTML = `
    <div class="tmpl-head">
      <button class="btn-icon" onclick="cancelTemplateEdit()">${iconHTML("chevron-left")}</button>
      <h1>${draft.isNew ? "New Template" : "Edit Template"}</h1>
      <span></span>
    </div>

    <label class="field-label">Name</label>
    <input class="input" id="tmpl-name" type="text" placeholder="e.g. Push Day" value="${escapeHtml(draft.name)}">

    <div class="tmpl-ex-list">
      ${draft.exercises.length ? draft.exercises.map((ex, i) => tmplExerciseRowHTML(ex, i, draft.exercises.length)).join("") : `<p class="muted">No exercises added yet.</p>`}
    </div>

    <button class="btn btn-secondary btn-block" id="tmpl-add-btn">${App.templatePickerOpen ? `${iconHTML("chevron-up")}<span>Close Picker</span>` : `${iconHTML("plus")}<span>Add Exercise</span>`}</button>
    ${App.templatePickerOpen ? templatePickerHTML(draft) : ""}

    <div class="auth-error" id="tmpl-error"></div>
    <button class="btn btn-primary btn-block" id="tmpl-save-btn">${iconHTML("check")}<span>Save Template</span></button>
  `;
  bindTemplateEditorEvents(screen);
}

function tmplExerciseRowHTML(ex, i, total) {
  const meta = exerciseById(ex.exerciseId);
  return `
    <div class="card tmpl-ex-row">
      <div class="tmpl-ex-row-move">
        <button class="btn-icon tmpl-move-btn" ${i === 0 ? "disabled" : ""} onclick="moveDraftExercise(${i}, -1)">${iconHTML("chevron-up")}</button>
        <button class="btn-icon tmpl-move-btn" ${i === total - 1 ? "disabled" : ""} onclick="moveDraftExercise(${i}, 1)">${iconHTML("chevron-down")}</button>
      </div>
      <div class="tmpl-ex-row-name">${escapeHtml(meta.name)}</div>
      <div class="tmpl-ex-row-fields">
        <input class="input" type="number" min="1" value="${ex.sets}" onchange="updateDraftExerciseField(${i}, 'sets', this.value)">
        <span class="muted">sets</span>
        <input class="input" type="number" min="1" value="${ex.reps}" onchange="updateDraftExerciseField(${i}, 'reps', this.value)">
        <span class="muted">${meta.isHold ? "sec" : "reps"}</span>
      </div>
      <button class="btn-icon" onclick="removeExerciseFromDraft(${i})">${iconHTML("x")}</button>
    </div>`;
}

function moveDraftExercise(i, direction) {
  const exercises = App.templateEditing.exercises;
  const j = i + direction;
  if (j < 0 || j >= exercises.length) return;
  [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
  renderTemplates();
}

function templatePickerHTML(draft) {
  const cat = App.templatePickerCat || "all";
  const usedIds = new Set(draft.exercises.map((e) => e.exerciseId));
  const allExercises = allExercisesIncludingCustom();
  const items = cat === "all" ? allExercises : allExercises.filter((e) => e.category === cat);
  return `
    <div class="chip-filter" id="tmpl-picker-filter">
      ${["all", "upper", "lower", "core", "cardio"].map((c) => `<button class="chip-toggle ${c === cat ? "on" : ""}" data-cat="${c}">${c === "all" ? "All" : CATEGORY_LABELS[c]}</button>`).join("")}
    </div>
    <div class="lib-list">
      ${items.map((ex) => `
        <div class="card lib-item tmpl-picker-item ${usedIds.has(ex.id) ? "added" : ""}" data-ex="${ex.id}">
          <div class="ex-pose small">${POSES[ex.pose]}</div>
          <div class="lib-item-body">
            <h3>${escapeHtml(ex.name)}</h3>
            <p class="muted">${CATEGORY_LABELS[ex.category]}</p>
          </div>
          ${usedIds.has(ex.id) ? `<span class="muted small">Added</span>` : ""}
        </div>`).join("")}
    </div>
  `;
}

function bindTemplateEditorEvents(screen) {
  const nameInput = document.getElementById("tmpl-name");
  nameInput.addEventListener("input", () => { App.templateEditing.name = nameInput.value; });

  document.getElementById("tmpl-add-btn").addEventListener("click", () => {
    App.templatePickerOpen = !App.templatePickerOpen;
    renderTemplates();
  });

  document.getElementById("tmpl-save-btn").addEventListener("click", saveTemplateDraft);

  const filterBar = document.getElementById("tmpl-picker-filter");
  if (filterBar) {
    filterBar.querySelectorAll(".chip-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        App.templatePickerCat = btn.dataset.cat;
        renderTemplates();
      });
    });
  }

  screen.querySelectorAll(".tmpl-picker-item:not(.added)").forEach((item) => {
    item.addEventListener("click", () => addExerciseToDraft(item.dataset.ex));
  });
}

function addExerciseToDraft(exerciseId) {
  const ex = exerciseById(exerciseId);
  const profile = Store.getProfile();
  const { sets, reps } = scaleFor(ex, profile);
  App.templateEditing.exercises.push({ exerciseId, sets, reps });
  renderTemplates();
}

function removeExerciseFromDraft(i) {
  App.templateEditing.exercises.splice(i, 1);
  renderTemplates();
}

function updateDraftExerciseField(i, field, value) {
  App.templateEditing.exercises[i][field] = Math.max(1, Number(value) || 1);
}

function saveTemplateDraft() {
  const draft = App.templateEditing;
  const errBox = document.getElementById("tmpl-error");
  const name = (document.getElementById("tmpl-name").value || "").trim();
  if (!name) { errBox.textContent = "Give this template a name."; return; }
  if (!draft.exercises.length) { errBox.textContent = "Add at least one exercise."; return; }
  const now = new Date().toISOString();
  Store.saveTemplate({
    id: draft.id,
    name,
    exercises: draft.exercises,
    createdAt: draft.createdAt || now,
    updatedAt: now,
  });
  App.templateEditing = null;
  App.templatePickerOpen = false;
  renderTemplates();
}

// Template sessions need a real (non-null) dayIndex — workout_history.day_index is NOT NULL
// in supabase/schema.sql, so `null` here would make Sync.pushLocal's upsert throw and block
// syncing the user's entire workout history, not just this row. Deriving a stable negative
// int per template id keeps each template's workouts collapsing to one record per day (same
// semantics as a plan day), while staying clear of real plan dayIndex values (always 0-6) and
// distinct from other templates.
function templateSyntheticDayIndex(templateId) {
  let hash = 5381;
  for (let i = 0; i < templateId.length; i++) hash = ((hash << 5) + hash + templateId.charCodeAt(i)) | 0;
  return -Math.abs(hash) - 1000;
}

function startWorkoutFromTemplate(templateId) {
  const template = Store.getTemplates().find((t) => t.id === templateId);
  if (!template) return;
  const workoutHistory = Store.get().workoutHistory;
  const session = {
    dayIndex: templateSyntheticDayIndex(template.id),
    templateId: template.id,
    startedAt: Date.now(),
    exercises: template.exercises.map((ex) => {
      const { sets, reps } = adjustedSetsReps(ex.sets, ex.reps, ex.exerciseId, workoutHistory);
      return { exerciseId: ex.exerciseId, sets, reps, done: new Array(sets).fill(false), warmup: new Array(sets).fill(false), difficulty: null };
    }),
  };
  Store.saveSession(session);
  go("session");
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
    let items = allExercisesIncludingCustom();
    if (cat === "safe") items = items.filter((e) => safeForProfile(e, profile));
    else if (cat !== "all") items = items.filter((e) => e.category === cat);
    list.innerHTML = items.map((ex) => `
      <div class="card lib-item" onclick="viewExerciseHistory('${ex.id}')">
        <div class="ex-pose small">${POSES[ex.pose]}</div>
        <div class="lib-item-body">
          <h3>${escapeHtml(ex.name)}</h3>
          <p class="muted">${CATEGORY_LABELS[ex.category]}${ex.targets && ex.targets.length ? " · targets " + ex.targets.map((t) => PROBLEM_AREA_LABELS[t] || t).join(", ") : ""}</p>
          ${ex.avoidInjuries.length ? `<p class="muted small">Avoid if: ${ex.avoidInjuries.map((a) => INJURY_LABELS[a]).join(", ")}</p>` : ""}
        </div>
        <span class="lib-item-chevron">${iconHTML("chevron-right")}</span>
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

// ---------- Exercise History ----------

function viewExerciseHistory(exerciseId) {
  App.historyExerciseId = exerciseId;
  go("exercise-history");
}

function exerciseHistoryFor(exerciseId) {
  const db = Store.get();
  const entries = [];
  for (const w of db.workoutHistory) {
    const r = (w.exerciseResults || []).find((e) => e.exerciseId === exerciseId);
    if (r) {
      const warmupSetsDone = r.warmupSetsDone || 0;
      entries.push({
        date: w.date,
        setsDone: r.setsDone,
        setsPrescribed: r.setsPrescribed,
        reps: r.reps != null ? r.reps : null,
        warmupSetsDone,
        workingSets: Math.max(0, r.setsDone - warmupSetsDone),
      });
    }
  }
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries;
}

// Warm-up-only entries (every completed set flagged as warm-up) don't count toward PRs —
// they're not a real working performance for this exercise.
function exercisePRs(entries) {
  const working = entries.filter((e) => e.workingSets > 0);
  if (!working.length) return null;
  let bestReps = 0, bestSets = 0;
  for (const e of working) {
    if (e.reps != null && e.reps > bestReps) bestReps = e.reps;
    if (e.workingSets > bestSets) bestSets = e.workingSets;
  }
  const last = working[working.length - 1];
  return { bestReps, bestSets, timesPerformed: working.length, last };
}

function renderExerciseHistory() {
  App.root.innerHTML = `<div class="screen" id="screen"></div>`;
  const screen = document.getElementById("screen");
  const ex = exerciseById(App.historyExerciseId);
  if (!ex) { go("library"); return; }

  const entries = exerciseHistoryFor(ex.id);
  const pr = exercisePRs(entries);
  const unit = ex.isHold ? "s" : " reps";

  screen.innerHTML = `
    <div class="tmpl-head">
      <button class="btn-icon" onclick="go('library')">${iconHTML("chevron-left")}</button>
      <h1>${escapeHtml(ex.name)}</h1>
      <span></span>
    </div>

    <div class="card ex-history-summary">
      <div class="ex-pose ex-history-pose">${POSES[ex.pose]}</div>
      <p class="muted">${CATEGORY_LABELS[ex.category]}${ex.targets && ex.targets.length ? " · targets " + ex.targets.map((t) => PROBLEM_AREA_LABELS[t] || t).join(", ") : ""}</p>
    </div>

    ${pr ? `
      <div class="stat-row">
        <div class="stat-tile"><span class="stat-num">${pr.bestReps || "—"}</span><span class="stat-label">Best ${ex.isHold ? "Hold (s)" : "Reps"}</span></div>
        <div class="stat-tile"><span class="stat-num">${pr.bestSets}</span><span class="stat-label">Best Sets</span></div>
        <div class="stat-tile"><span class="stat-num">${pr.timesPerformed}</span><span class="stat-label">Times Done</span></div>
      </div>

      <div class="card">
        <div class="eyebrow">${iconHTML("trending-up")}<span>${ex.isHold ? "Hold Time" : "Reps"} Over Time</span></div>
        <canvas id="chart-ex-history" class="chart"></canvas>
      </div>

      <div class="card">
        <div class="eyebrow">${iconHTML("history")}<span>History</span></div>
        ${entries.slice().reverse().map((e) => `
          <div class="history-row">
            <span>${e.date}</span>
            <span>${e.setsDone}/${e.setsPrescribed} sets${e.warmupSetsDone ? ` (${e.warmupSetsDone} warmup)` : ""}</span>
            <span>${e.reps != null ? e.reps + unit : "—"}</span>
          </div>
        `).join("")}
      </div>
    ` : `
      <div class="card"><p class="muted">You haven't logged this exercise yet — complete a workout that includes it to start tracking your performance here.</p></div>
    `}
  `;

  if (pr) {
    const points = entries.filter((e) => e.workingSets > 0 && e.reps != null).map((e) => ({ y: e.reps }));
    drawLineChart(document.getElementById("chart-ex-history"), points, { emptyText: "Not enough data yet", minY: 0 });
  }
}

// ---------- Analytics ----------

function allExercisesWithHistory() {
  const db = Store.get();
  const ids = new Set();
  for (const w of db.workoutHistory) {
    for (const r of w.exerciseResults || []) ids.add(r.exerciseId);
  }
  return Array.from(ids).map((id) => exerciseById(id)).filter(Boolean);
}

const MUSCLE_GROUP_SHORT_LABELS = {
  belly_fat: "Belly", love_handles: "Obliques", chest: "Chest", arms: "Arms",
  thighs: "Thighs", back: "Back", glutes: "Glutes",
};

// An exercise counts toward every muscle group it targets (matching how `targets` is already
// used for problem-area prioritization in workout-generator.js), using only working sets.
function weeklyVolumeByMuscleGroup(workoutHistory) {
  const startISO = weekStartISO();
  const totals = {};
  Object.keys(PROBLEM_AREA_LABELS).forEach((k) => { totals[k] = 0; });
  for (const w of workoutHistory) {
    if (w.date < startISO) continue;
    for (const r of w.exerciseResults || []) {
      const ex = exerciseById(r.exerciseId);
      if (!ex) continue;
      const workingSets = Math.max(0, r.setsDone - (r.warmupSetsDone || 0));
      const volume = workingSets * (r.reps || 0);
      for (const t of ex.targets || []) {
        if (totals[t] != null) totals[t] += volume;
      }
    }
  }
  return totals;
}

function volumeByWeekday(workoutHistory) {
  const totals = new Array(7).fill(0); // 0=Sun..6=Sat
  for (const w of workoutHistory) {
    const day = new Date(w.date + "T00:00:00").getDay();
    for (const r of w.exerciseResults || []) {
      const workingSets = Math.max(0, r.setsDone - (r.warmupSetsDone || 0));
      totals[day] += workingSets * (r.reps || 0);
    }
  }
  return totals;
}

function exportDataCSV() {
  const db = Store.get();
  const header = ["Date", "Type", "Exercise", "Category", "SetsDone", "SetsPrescribed", "RepsOrHold", "WarmupSets", "WeightKg", "Pushups", "Pullups", "DurationMin", "CompletionPct"];
  const rows = [];

  for (const w of db.workoutHistory) {
    for (const r of w.exerciseResults || []) {
      const ex = exerciseById(r.exerciseId);
      rows.push([
        w.date, "Workout", ex ? ex.name : r.exerciseId, ex ? CATEGORY_LABELS[ex.category] : "",
        r.setsDone, r.setsPrescribed, r.reps != null ? r.reps : "", r.warmupSetsDone || 0,
        "", "", "", w.durationMin, w.completionPct,
      ]);
    }
  }
  for (const w of db.weightLog) {
    rows.push([w.date, "BodyWeight", "", "", "", "", "", "", w.weightKg, "", "", "", ""]);
  }
  for (const t of db.testLog) {
    rows.push([t.date, "StrengthTest", "", "", "", "", "", "", "", t.pushups, t.pullups, "", ""]);
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]));

  const csvEscape = (v) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tacfit-export-${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Progress Photos ----------
// Requires an account — the image bytes need somewhere durable to live, and this app has no
// offline blob store. Degrades to an explanatory message when signed out.

function progressPhotosHTML() {
  if (typeof Auth === "undefined" || !Auth.isAvailable() || !App.user) {
    return `
      <div class="card">
        <div class="eyebrow">${iconHTML("camera")}<span>Progress Photos</span></div>
        <p class="muted">Sign in (see Profile) to add and sync progress photos across devices.</p>
      </div>`;
  }
  const photos = Store.getProgressPhotos();
  return `
    <div class="card">
      <div class="eyebrow">${iconHTML("camera")}<span>Progress Photos</span></div>
      <input type="file" accept="image/*" id="photo-input" style="display:none">
      <button class="btn btn-secondary btn-block" id="add-photo-btn">${iconHTML("camera")}<span>Add Photo</span></button>
      <div class="auth-error" id="photo-error"></div>
      <div class="photo-gallery">
        ${photos.length ? photos.slice().reverse().map((p) => `
          <div class="photo-thumb" id="thumb-${p.id}" onclick="viewProgressPhoto('${p.id}')">
            <span class="photo-thumb-date">${p.date}</span>
          </div>`).join("") : `<p class="muted">No photos yet.</p>`}
      </div>
    </div>
    ${App.photoLightboxId ? photoLightboxHTML() : ""}`;
}

function bindProgressPhotoEvents(screen) {
  const addBtn = document.getElementById("add-photo-btn");
  const input = document.getElementById("photo-input");
  if (addBtn && input) {
    addBtn.addEventListener("click", () => input.click());
    input.addEventListener("change", () => handlePhotoUpload(input.files[0], screen));
  }
  Store.getProgressPhotos().forEach(loadPhotoThumb);
}

async function loadPhotoThumb(photo) {
  if (!supabaseClient) return;
  const el = document.getElementById(`thumb-${photo.id}`);
  if (!el) return;
  const { data, error } = await supabaseClient.storage.from("progress-photos").createSignedUrl(photo.storagePath, 3600);
  if (error || !data) return;
  el.style.backgroundImage = `url("${data.signedUrl}")`;
}

async function handlePhotoUpload(file, screen) {
  if (!file) return;
  const errBox = document.getElementById("photo-error");
  if (errBox) errBox.textContent = "";
  try {
    const uid = App.user.id;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${uid}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseClient.storage.from("progress-photos").upload(path, file);
    if (error) throw error;
    Store.addProgressPhoto({ id: crypto.randomUUID(), date: todayISO(), storagePath: path, createdAt: new Date().toISOString() });
    renderAnalytics(screen);
  } catch (e) {
    if (errBox) errBox.textContent = e.message || "Upload failed.";
  }
}

function viewProgressPhoto(id) {
  App.photoLightboxId = id;
  App.photoLightboxUrl = null;
  renderAnalytics(document.getElementById("screen"));
  loadLightboxUrl(id);
}

async function loadLightboxUrl(id) {
  const photo = Store.getProgressPhotos().find((p) => p.id === id);
  if (!photo || !supabaseClient) return;
  const { data, error } = await supabaseClient.storage.from("progress-photos").createSignedUrl(photo.storagePath, 3600);
  if (App.photoLightboxId !== id || error || !data) return;
  App.photoLightboxUrl = data.signedUrl;
  const img = document.getElementById("photo-lightbox-img");
  if (img) img.src = App.photoLightboxUrl;
}

function closePhotoLightbox() {
  App.photoLightboxId = null;
  App.photoLightboxUrl = null;
  renderAnalytics(document.getElementById("screen"));
}

function photoLightboxHTML() {
  const photo = Store.getProgressPhotos().find((p) => p.id === App.photoLightboxId);
  if (!photo) return "";
  return `
    <div class="rest-modal-backdrop">
      <div class="card rest-modal photo-lightbox-card">
        ${App.photoLightboxUrl ? `<img id="photo-lightbox-img" src="${App.photoLightboxUrl}" class="photo-lightbox-img" alt="Progress photo ${photo.date}">` : `<p class="muted">Loading…</p>`}
        <p class="muted">${photo.date}</p>
        <div class="row2">
          <button class="btn btn-danger" onclick="deleteProgressPhotoConfirm('${photo.id}')">${iconHTML("trash")}<span>Delete</span></button>
          <button class="btn btn-primary" onclick="closePhotoLightbox()">${iconHTML("x")}<span>Close</span></button>
        </div>
      </div>
    </div>`;
}

async function deleteProgressPhotoConfirm(id) {
  if (!confirm("Delete this photo?")) return;
  const photo = Store.getProgressPhotos().find((p) => p.id === id);
  if (photo) await deleteProgressPhotoRemote(photo);
  Store.deleteProgressPhoto(id);
  closePhotoLightbox();
}

async function deleteProgressPhotoRemote(photo) {
  if (!supabaseClient || !App.user) return;
  try {
    await supabaseClient.storage.from("progress-photos").remove([photo.storagePath]);
    await supabaseClient.from("progress_photos").delete().eq("id", photo.id);
  } catch (e) {}
}

// ---------- Milestone badges ----------

function milestonesCardHTML(workoutHistory) {
  const earned = earnedBadgeIds(workoutHistory);
  return `
    <div class="card">
      <div class="eyebrow">${iconHTML("award")}<span>Milestones</span></div>
      <p class="muted small">${earned.size} of ${BADGES.length} earned</p>
      <div class="badge-grid">
        ${BADGES.map((b) => `
          <div class="badge-tile ${earned.has(b.id) ? "earned" : ""}">
            <span class="badge-icon">${iconHTML(b.icon)}</span>
            <span class="badge-label">${escapeHtml(b.label)}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

function achievementModalHTML() {
  if (!App.newBadges || !App.newBadges.length) return "";
  return `
    <div class="rest-modal-backdrop">
      <div class="card rest-modal rest-modal-done">
        <div class="rest-modal-icon">${iconHTML(App.newBadges[0].icon)}</div>
        <div class="rest-modal-headline">Achievement Unlocked!</div>
        <p class="muted">${App.newBadges.map((b) => escapeHtml(b.label)).join(" · ")}</p>
        <button class="btn btn-primary btn-block" onclick="dismissAchievementModal()">${iconHTML("check")}<span>Nice!</span></button>
      </div>
    </div>`;
}

function dismissAchievementModal() {
  App.newBadges = null;
  render();
}

function renderAnalytics(screen) {
  const db = Store.get();
  const profile = db.profile;
  const bmi = computeBMI(profile.weightKg, profile.heightCm);
  const cat = bmiCategory(bmi);
  const latest = latestTest(db);
  const fit = fitnessScore(latest.pushups, latest.pullups);

  const strengthGains = allExercisesWithHistory()
    .map((ex) => {
      const entries = exerciseHistoryFor(ex.id);
      const pr = exercisePRs(entries);
      return pr ? { ex, entries, pr } : null;
    })
    .filter(Boolean);

  const muscleVolume = weeklyVolumeByMuscleGroup(db.workoutHistory);
  const weekdayVolume = volumeByWeekday(db.workoutHistory);
  const maxWeekdayVolume = Math.max(1, ...weekdayVolume);
  const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  screen.innerHTML = `
    <div class="header header-with-action">
      <h1>Progress</h1>
      <button class="btn btn-secondary" id="export-csv-btn">${iconHTML("download")}<span>Export CSV</span></button>
    </div>

    ${milestonesCardHTML(db.workoutHistory)}

    <div class="card">
      <div class="eyebrow">${iconHTML("trending-down")}<span>Weight Trend</span></div>
      <canvas id="chart-weight" class="chart"></canvas>
    </div>

    <div class="card">
      <div class="eyebrow">${iconHTML("scale")}<span>BMI</span></div>
      <div class="big-metric">${bmi ? bmi.toFixed(1) : "—"} <span class="tag tag-${cat.tone}">${cat.label}</span></div>
    </div>

    <div class="card">
      <div class="eyebrow">${iconHTML("zap")}<span>Fitness Level</span></div>
      <div class="two-col">
        <div><span class="stat-num">${latest.pushups}</span><span class="stat-label">Push-ups (${fit.pushupLevel})</span></div>
        <div><span class="stat-num">${latest.pullups}</span><span class="stat-label">Pull-ups (${fit.pullupLevel})</span></div>
      </div>
      <p class="muted">${fitnessVsBmiInsight(bmi, fit)}</p>
      <button class="btn btn-secondary btn-block" id="log-test-btn">${iconHTML("plus")}<span>Log New Test</span></button>
      <div id="test-form"></div>
    </div>

    <div class="card">
      <div class="eyebrow">${iconHTML("trending-up")}<span>Push-up / Pull-up Progression</span></div>
      <canvas id="chart-strength" class="chart"></canvas>
    </div>

    <div class="card">
      <div class="eyebrow">${iconHTML("trending-up")}<span>Strength Gains</span></div>
      ${strengthGains.length ? strengthGains.map(({ ex, pr }) => `
        <div class="sgain-row" onclick="viewExerciseHistory('${ex.id}')">
          <div class="sgain-info">
            <h3>${escapeHtml(ex.name)}</h3>
            <p class="muted">${pr.bestReps}${ex.isHold ? "s" : " reps"} best · ${pr.timesPerformed}× done</p>
          </div>
          <canvas class="sgain-spark" id="spark-${ex.id}"></canvas>
        </div>
      `).join("") : `<p class="muted">Complete workouts to start seeing strength trends here.</p>`}
    </div>

    <div class="card">
      <div class="eyebrow">${iconHTML("bar-chart-3")}<span>Weekly Volume by Muscle Group</span></div>
      <canvas id="chart-muscle-volume" class="chart"></canvas>
    </div>

    <div class="card">
      <div class="eyebrow">${iconHTML("calendar-days")}<span>Training Volume by Day of Week</span></div>
      <div class="weekday-heatmap">
        ${WEEKDAY_LABELS.map((label, i) => {
          const v = weekdayVolume[i];
          const intensity = v > 0 ? Math.round((0.15 + 0.85 * (v / maxWeekdayVolume)) * 100) : 0;
          return `
            <div class="weekday-tile" style="background: color-mix(in srgb, var(--accent) ${intensity}%, var(--surface-2));">
              <span class="weekday-tile-label">${label}</span>
              <span class="weekday-tile-value">${v}</span>
            </div>`;
        }).join("")}
      </div>
    </div>

    <div class="card">
      <div class="eyebrow">${iconHTML("bar-chart")}<span>Workout Frequency — Current vs Prescribed</span></div>
      <canvas id="chart-freq" class="chart"></canvas>
    </div>

    ${progressPhotosHTML()}

    <div class="card">
      <div class="eyebrow">${iconHTML("list")}<span>Recent Workouts</span></div>
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

  strengthGains.forEach(({ ex, entries }) => {
    const points = entries.filter((e) => e.workingSets > 0 && e.reps != null).map((e) => ({ y: e.reps }));
    const canvas = document.getElementById(`spark-${ex.id}`);
    if (canvas) drawLineChart(canvas, points, { emptyText: "", minY: 0 });
  });

  drawBarChart(document.getElementById("chart-muscle-volume"), Object.keys(PROBLEM_AREA_LABELS).map((k) => ({
    label: MUSCLE_GROUP_SHORT_LABELS[k] || k, v: muscleVolume[k],
  })));

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
      <button class="btn btn-primary btn-block" id="save-test-btn">${iconHTML("check")}<span>Save Test</span></button>
    `;
    document.getElementById("save-test-btn").addEventListener("click", () => {
      const pu = Number(document.getElementById("new-pushups").value) || 0;
      const pl = Number(document.getElementById("new-pullups").value) || 0;
      Store.logTest(pu, pl);
      renderAnalytics(screen);
    });
  });

  document.getElementById("export-csv-btn").addEventListener("click", exportDataCSV);

  bindProgressPhotoEvents(screen);
}

// ---------- Settings ----------

function renderSettings(screen) {
  const profile = Store.getProfile();
  screen.innerHTML = `
    <div class="header"><h1>Profile & Settings</h1></div>

    ${accountCardHTML()}

    <div class="card">
      <div class="review-grid">
        <div class="review-item"><span>Name</span><b>${escapeHtml(profile.name) || "—"}</b></div>
        <div class="review-item"><span>Age Range</span><b>${profile.ageRange || "—"}</b></div>
        <div class="review-item"><span>Body Type</span><b>${labelFor(BODY_TYPES, profile.bodyType)}</b></div>
        <div class="review-item"><span>Goal</span><b>${labelFor(GOAL_OPTIONS, profile.primaryGoal)}</b></div>
        <div class="review-item"><span>Frequency</span><b>${profile.prescribedFrequency}x/week · ${profile.duration}min</b></div>
        <div class="review-item"><span>Injuries</span><b>${(profile.injuries || []).map((a) => INJURY_LABELS[a]).join(", ") || "None"}</b></div>
      </div>
      <button class="btn btn-secondary btn-block" onclick="editProfile()">${iconHTML("edit")}<span>Edit Full Profile</span></button>
    </div>

    <div class="card">
      <div class="eyebrow">${iconHTML("scale")}<span>Log Today's Weight (${profile.units === "metric" ? "kg" : "lb"})</span></div>
      <div class="row2">
        <input class="input" id="new-weight" type="number">
        <button class="btn btn-primary" id="save-weight-btn">${iconHTML("check")}<span>Save</span></button>
      </div>
    </div>

    <div class="card">
      <div class="eyebrow">${iconHTML("activity")}<span>Reminders</span></div>
      <p class="muted">A daily nudge if you haven't logged a workout yet, timed to your preferred ${profile.timeOfDay || "flexible"} time slot.</p>
      <div class="segmented">
        <button class="seg ${profile.remindersEnabled !== false ? "on" : ""}" id="reminders-on-btn">On</button>
        <button class="seg ${profile.remindersEnabled === false ? "on" : ""}" id="reminders-off-btn">Off</button>
      </div>
    </div>

    <div class="card">
      <div class="eyebrow">${iconHTML("alert-triangle")}<span>Danger Zone</span></div>
      <button class="btn btn-danger btn-block" id="reset-btn">${iconHTML("trash")}<span>Reset All Data</span></button>
    </div>
  `;
  document.getElementById("reminders-on-btn").addEventListener("click", () => setRemindersEnabled(profile, screen, true));
  document.getElementById("reminders-off-btn").addEventListener("click", () => setRemindersEnabled(profile, screen, false));
  document.getElementById("save-weight-btn").addEventListener("click", () => {
    const raw = Number(document.getElementById("new-weight").value);
    if (!raw) return;
    const kg = profile.units === "metric" ? raw : lbToKg(raw);
    Store.logWeight(kg);
    profile.weightKg = kg;
    profile.updatedAt = todayISO();
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
  bindAccountCardEvents(screen);
}

function setRemindersEnabled(profile, screen, enabled) {
  profile.remindersEnabled = enabled;
  profile.updatedAt = todayISO();
  Store.saveProfile(profile);
  Notifications.sync(profile);
  renderSettings(screen);
}

// ---------- Account (optional sign-in / sync) ----------

function accountCardHTML() {
  if (typeof Auth === "undefined" || !Auth.isAvailable()) {
    return `
      <div class="card">
        <div class="eyebrow">${iconHTML("user-circle")}<span>Account</span></div>
        <p class="muted">Sign-in isn't configured for this install — your data stays on this device only.</p>
      </div>`;
  }
  if (App.user) {
    return `
      <div class="card">
        <div class="eyebrow">${iconHTML("user-circle")}<span>Account</span></div>
        <p>${escapeHtml(App.user.email)} <span class="tag sync-tag-${Sync.status}">${syncStatusLabel(Sync.status)}</span></p>
        <button class="btn btn-secondary btn-block" id="signout-btn">${iconHTML("log-out")}<span>Sign Out</span></button>
      </div>`;
  }
  return `
    <div class="card">
      <div class="eyebrow">${iconHTML("user-circle")}<span>Account</span></div>
      <p class="muted">Optional — sign in to sync your data across devices. The app fully works offline without one.</p>
      <input class="input" id="auth-email" type="email" placeholder="Email" autocomplete="email">
      <label class="field-label">Password</label>
      <input class="input" id="auth-password" type="password" placeholder="At least 6 characters" autocomplete="current-password">
      <div class="auth-error" id="auth-error"></div>
      <div class="row2">
        <button class="btn btn-secondary" id="signup-btn">${iconHTML("plus")}<span>Sign Up</span></button>
        <button class="btn btn-primary" id="signin-btn">${iconHTML("chevron-right")}<span>Log In</span></button>
      </div>
    </div>`;
}

function syncStatusLabel(status) {
  return { idle: "Synced", syncing: "Syncing…", "offline-queued": "Offline", error: "Sync error" }[status] || "";
}

function bindAccountCardEvents(screen) {
  const signOutBtn = document.getElementById("signout-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      await Auth.signOut();
      renderSettings(screen);
    });
  }
  const signUpBtn = document.getElementById("signup-btn");
  const signInBtn = document.getElementById("signin-btn");
  if (signUpBtn) signUpBtn.addEventListener("click", () => handleAuthSubmit(screen, "signUp"));
  if (signInBtn) signInBtn.addEventListener("click", () => handleAuthSubmit(screen, "signIn"));
}

async function handleAuthSubmit(screen, method) {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const errBox = document.getElementById("auth-error");
  errBox.textContent = "";
  if (!email || password.length < 6) {
    errBox.textContent = "Enter an email and a password of at least 6 characters.";
    return;
  }
  const result = await Auth[method](email, password);
  if (result.error) {
    errBox.textContent = result.error;
    return;
  }
  renderSettings(screen);
}

function editProfile() {
  App.draft = { ...Store.getProfile() };
  App.draft._editing = true;
  const h = cmToFeetIn(App.draft.heightCm || 170);
  App.draft.heightFt = h.ft; App.draft.heightIn = h.inch;
  App.draft.heightCmRaw = Math.round(App.draft.heightCm || 170);
  App.draft.weightRaw = App.draft.units === "metric" ? Math.round(App.draft.weightKg) : Math.round(kgToLb(App.draft.weightKg));
  App.step = 0;
  go("onboarding");
}
