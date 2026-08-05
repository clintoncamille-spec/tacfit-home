// Keeps the local Store (source of truth for reads/writes) mirrored to Supabase when signed in.
// currentPlan/activeSession are intentionally never synced — they're derived/ephemeral state that
// each device can rebuild locally from profile + workoutHistory.
"use strict";

const Sync = {
  status: "idle", // idle | syncing | offline-queued | error
  _user: null,
  _pushTimer: null,
  _onStatus: null,

  setStatusListener(fn) {
    this._onStatus = fn;
  },

  _setStatus(s) {
    this.status = s;
    if (this._onStatus) this._onStatus(s);
  },

  schedulePush() {
    if (!this._user || !supabaseClient) return;
    clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => this.pushLocal(), 1500);
  },

  async pushLocal() {
    if (!this._user || !supabaseClient) return;
    if (!navigator.onLine) {
      this._setStatus("offline-queued");
      return;
    }
    this._setStatus("syncing");
    try {
      const db = Store.get();
      const uid = this._user.id;

      if (db.profile) {
        const res = await supabaseClient
          .from("profiles")
          .upsert({ user_id: uid, data: db.profile, updated_at: new Date().toISOString() });
        if (res.error) throw res.error;
      }
      if (db.weightLog.length) {
        const res = await supabaseClient
          .from("weight_logs")
          .upsert(
            db.weightLog.map((w) => ({ user_id: uid, date: w.date, weight_kg: w.weightKg })),
            { onConflict: "user_id,date" }
          );
        if (res.error) throw res.error;
      }
      if (db.testLog.length) {
        const res = await supabaseClient
          .from("test_logs")
          .upsert(
            db.testLog.map((t) => ({ user_id: uid, date: t.date, pushups: t.pushups, pullups: t.pullups })),
            { onConflict: "user_id,date" }
          );
        if (res.error) throw res.error;
      }
      if (db.workoutHistory.length) {
        const res = await supabaseClient
          .from("workout_history")
          .upsert(
            db.workoutHistory.map((w) => ({
              user_id: uid,
              date: w.date,
              day_index: w.dayIndex,
              exercise_results: w.exerciseResults,
              duration_min: w.durationMin,
              completion_pct: w.completionPct,
            })),
            { onConflict: "user_id,date,day_index" }
          );
        if (res.error) throw res.error;
      }
      if (db.progressPhotos.length) {
        const res = await supabaseClient
          .from("progress_photos")
          .upsert(
            db.progressPhotos.map((p) => ({ id: p.id, user_id: uid, date: p.date, storage_path: p.storagePath, created_at: p.createdAt })),
            { onConflict: "id" }
          );
        if (res.error) throw res.error;
      }
      this._setStatus("idle");
    } catch (e) {
      this._setStatus("error");
    }
  },

  async pullRemote() {
    if (!this._user || !supabaseClient) return;
    this._setStatus("syncing");
    try {
      const uid = this._user.id;
      const [profileRes, weightRes, testRes, historyRes, photosRes] = await Promise.all([
        supabaseClient.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
        supabaseClient.from("weight_logs").select("*").eq("user_id", uid),
        supabaseClient.from("test_logs").select("*").eq("user_id", uid),
        supabaseClient.from("workout_history").select("*").eq("user_id", uid),
        supabaseClient.from("progress_photos").select("*").eq("user_id", uid),
      ]);

      const firstError = profileRes.error || weightRes.error || testRes.error || historyRes.error || photosRes.error;
      if (firstError) throw firstError;

      const db = Store.get();
      this._mergeProfile(db, profileRes.data);
      this._mergeWeight(db, weightRes.data || []);
      this._mergeTest(db, testRes.data || []);
      this._mergeHistory(db, historyRes.data || []);
      this._mergePhotos(db, photosRes.data || []);
      Store.save(db);
      this._setStatus("idle");
    } catch (e) {
      this._setStatus("error");
    }
  },

  _mergeProfile(db, remoteRow) {
    if (!remoteRow || !remoteRow.data) return;
    const localUpdatedAt = db.profile && db.profile.updatedAt;
    if (!db.profile || !localUpdatedAt || new Date(remoteRow.updated_at) > new Date(localUpdatedAt)) {
      db.profile = remoteRow.data;
    }
  },

  _mergeWeight(db, rows) {
    const byDate = new Map(db.weightLog.map((w) => [w.date, w]));
    for (const r of rows) byDate.set(r.date, { date: r.date, weightKg: r.weight_kg });
    db.weightLog = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  },

  _mergeTest(db, rows) {
    const byDate = new Map(db.testLog.map((t) => [t.date, t]));
    for (const r of rows) byDate.set(r.date, { date: r.date, pushups: r.pushups, pullups: r.pullups });
    db.testLog = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  },

  _mergeHistory(db, rows) {
    const key = (date, dayIndex) => `${date}_${dayIndex}`;
    const byKey = new Map(db.workoutHistory.map((w) => [key(w.date, w.dayIndex), w]));
    for (const r of rows) {
      const k = key(r.date, r.day_index);
      if (!byKey.has(k)) {
        byKey.set(k, {
          date: r.date,
          dayIndex: r.day_index,
          exerciseResults: r.exercise_results,
          durationMin: r.duration_min,
          completionPct: r.completion_pct,
        });
      }
    }
    db.workoutHistory = Array.from(byKey.values()).sort((a, b) => a.date.localeCompare(b.date));
  },

  // Deletions go straight to Supabase at delete-time (see deleteProgressPhotoRemote in app.js),
  // so a plain union merge here is safe — there's no lingering "deleted on another device" case
  // to reconcile like there would be with local-only entities.
  _mergePhotos(db, rows) {
    const byId = new Map(db.progressPhotos.map((p) => [p.id, p]));
    for (const r of rows) {
      if (!byId.has(r.id)) {
        byId.set(r.id, { id: r.id, date: r.date, storagePath: r.storage_path, createdAt: r.created_at });
      }
    }
    db.progressPhotos = Array.from(byId.values()).sort((a, b) => a.date.localeCompare(b.date));
  },
};

if (typeof Auth !== "undefined") {
  Auth.onChange((user) => {
    Sync._user = user;
    if (user) {
      Sync.pullRemote().then(() => Sync.pushLocal());
    } else {
      Sync._setStatus("idle");
    }
  });
}

window.addEventListener("online", () => Sync.pushLocal());
