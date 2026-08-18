// Reminder logic, plus real OS-scheduled notifications where a platform actually
// supports them.
//
// Native (iOS/Android): schedules one real daily local notification via the
// Capacitor LocalNotifications plugin. The plugin proxy is created directly with
// window.Capacitor.registerPlugin(), NOT the @capacitor/local-notifications npm
// package's own JS wrapper — that wrapper is ESM-only and internally does
// `import { registerPlugin } from '@capacitor/core'`, a bare specifier the
// browser/WebView can't resolve without a bundler, which this project
// deliberately doesn't have. window.Capacitor itself is injected automatically
// by the native bridge before any of our own scripts run, so no bundler is
// needed for this direct-proxy approach — only `npx cap sync` is required, to
// copy the plugin's native Swift/Kotlin implementation into ios//android.
//
// Web/Electron: there is no OS-level scheduling possible without a push
// notification backend, so those platforms rely entirely on the in-app
// reminder banner (reminderBannerHTML in app.js), which recomputes live from
// the same reminderMessage() logic every time the dashboard renders.
"use strict";

const REMINDER_NOTIFICATION_ID = 1;
const TIME_OF_DAY_HOURS = { morning: 8, afternoon: 13, evening: 18, flexible: 10 };

function preferredReminderHour(profile) {
  return TIME_OF_DAY_HOURS[profile.timeOfDay] != null ? TIME_OF_DAY_HOURS[profile.timeOfDay] : TIME_OF_DAY_HOURS.flexible;
}

// Shared by both delivery paths so the native notification's daily copy and the
// in-app banner's live copy are always making the same "are they actually due
// for a nudge" judgment call from the same data.
function reminderMessage(profile, workoutHistory) {
  const today = todayISO();
  if (workoutHistory.some((w) => w.date === today)) return null;
  const thisWeek = countThisWeek(workoutHistory);
  const goal = profile.prescribedFrequency || 3;
  if (thisWeek < goal) {
    return { title: "You're behind this week", body: `${thisWeek}/${goal} workouts so far — one session gets you back on track.` };
  }
  return { title: "Time to move", body: "Haven't logged a workout yet today — got a few minutes?" };
}

const Notifications = {
  _plugin: null,

  isNativeAvailable() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  },

  _getPlugin() {
    if (!this.isNativeAvailable() || !window.Capacitor.registerPlugin) return null;
    if (!this._plugin) this._plugin = window.Capacitor.registerPlugin("LocalNotifications", {});
    return this._plugin;
  },

  // Call after any profile save (onboarding, editing, or toggling the Reminders
  // setting) — cancels and reschedules so it always reflects the latest
  // timeOfDay/remindersEnabled/prescribedFrequency.
  async sync(profile) {
    const plugin = this._getPlugin();
    if (!plugin) return; // web/Electron — nothing to schedule natively
    if (!profile || profile.remindersEnabled === false) {
      await plugin.cancel({ notifications: [{ id: REMINDER_NOTIFICATION_ID }] }).catch(() => {});
      return;
    }
    try {
      const current = await plugin.checkPermissions();
      if (current.display !== "granted") {
        const requested = await plugin.requestPermissions();
        if (requested.display !== "granted") return;
      }
      await plugin.schedule({
        notifications: [{
          id: REMINDER_NOTIFICATION_ID,
          title: "TacFit Home",
          body: "Time for today's workout — even 10 minutes counts.",
          schedule: { on: { hour: preferredReminderHour(profile), minute: 0 } },
        }],
      });
    } catch (e) {
      // Permission dialogs can be dismissed, plugin can be mid-registration on first
      // launch, etc. — reminders are a nice-to-have, never worth surfacing an error for.
    }
  },
};
