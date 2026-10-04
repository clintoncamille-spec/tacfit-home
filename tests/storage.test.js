"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadGlobal } = require("./load-global");

global.localStorage = {
  store: {},
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  },
};

global.Sync = {
  schedulePushCalls: 0,
  schedulePush() { this.schedulePushCalls += 1; },
};

loadGlobal("js/storage.js");

test("loadDB: migrates legacy schema and adds the current version", () => {
  global.localStorage.setItem("tacfit_v1", JSON.stringify({ profile: { name: "Ada" } }));
  const db = loadDB();

  assert.equal(db.version, 1);
  assert.equal(db.profile.name, "Ada");
  assert.deepEqual(db.weightLog, []);
  assert.deepEqual(db.workoutHistory, []);
});

test("saveDB: writes the DB schema version", () => {
  const db = {
    profile: { name: "Grace" },
    weightLog: [],
    testLog: [],
    workoutHistory: [],
    currentPlan: null,
    activeSession: null,
    workoutTemplates: [],
    progressPhotos: [],
    customExercises: [],
  };

  saveDB(db);
  const persisted = JSON.parse(global.localStorage.getItem("tacfit_v1"));

  assert.equal(persisted.version, 1);
  assert.equal(persisted.profile.name, "Grace");
});

test("Store.update: mutates the normalized DB through a single helper", () => {
  global.localStorage.setItem("tacfit_v1", JSON.stringify({
    profile: { name: "Ada" },
    weightLog: [],
    testLog: [],
    workoutHistory: [],
    currentPlan: null,
    activeSession: null,
    workoutTemplates: [],
    progressPhotos: [],
    customExercises: [],
  }));

  Store.update((db) => {
    db.profile = { ...db.profile, name: "Grace" };
    db.weightLog.push({ date: "2026-10-01", weightKg: 70 });
    return db;
  });

  const updated = Store.get();
  assert.equal(updated.profile.name, "Grace");
  assert.equal(updated.weightLog.length, 1);
  assert.equal(updated.version, 1);
});

test("Store.update: triggers the sync hook after writing", () => {
  global.localStorage.setItem("tacfit_v1", JSON.stringify({
    profile: { name: "Ada" },
    weightLog: [],
    testLog: [],
    workoutHistory: [],
    currentPlan: null,
    activeSession: null,
    workoutTemplates: [],
    progressPhotos: [],
    customExercises: [],
  }));

  global.Sync.schedulePushCalls = 0;
  Store.update((db) => {
    db.profile = { ...db.profile, name: "Grace" };
    return db;
  });

  assert.equal(global.Sync.schedulePushCalls, 1);
});

test("loadDB: sanitizes malformed saved records instead of trusting invalid shapes", () => {
  global.localStorage.setItem("tacfit_v1", JSON.stringify({
    version: 0,
    profile: "not-an-object",
    weightLog: { bad: true },
    testLog: "bad",
    workoutHistory: null,
    currentPlan: "bad-plan",
    activeSession: "bad-session",
    workoutTemplates: "bad-templates",
    progressPhotos: "bad-photos",
    customExercises: "bad-custom",
  }));

  const db = loadDB();

  assert.equal(db.profile, null);
  assert.deepEqual(db.weightLog, []);
  assert.deepEqual(db.testLog, []);
  assert.deepEqual(db.workoutHistory, []);
  assert.equal(db.currentPlan, null);
  assert.equal(db.activeSession, null);
  assert.deepEqual(db.workoutTemplates, []);
  assert.deepEqual(db.progressPhotos, []);
  assert.deepEqual(db.customExercises, []);
  assert.equal(db.version, 1);
});

test("loadDB: preserves valid entries and drops malformed items from list collections", () => {
  global.localStorage.setItem("tacfit_v1", JSON.stringify({
    profile: { name: "Ada" },
    weightLog: [
      { date: "2026-09-01", weightKg: 70 },
      "oops",
      null,
      { date: "2026-09-02", weightKg: 69.5 },
    ],
    testLog: [
      { date: "2026-09-01", pushups: 20, pullups: 8 },
      42,
      { date: "2026-09-02", pushups: 22, pullups: 10 },
    ],
    workoutHistory: [
      { date: "2026-09-01", completionPct: 100 },
      "bad",
      { date: "2026-09-02", completionPct: 80 },
    ],
    currentPlan: null,
    activeSession: null,
    workoutTemplates: [
      { id: "a", name: "Template A" },
      "bad-template",
    ],
    progressPhotos: [
      { id: "p1", date: "2026-09-01", storagePath: "/img/1.jpg" },
      null,
    ],
    customExercises: [
      { id: "x1", name: "Row" },
      99,
    ],
  }));

  const db = loadDB();

  assert.equal(db.weightLog.length, 2);
  assert.deepEqual(db.weightLog.map((entry) => entry.date), ["2026-09-01", "2026-09-02"]);
  assert.equal(db.testLog.length, 2);
  assert.equal(db.workoutHistory.length, 2);
  assert.equal(db.workoutTemplates.length, 1);
  assert.equal(db.progressPhotos.length, 1);
  assert.equal(db.customExercises.length, 1);
});
