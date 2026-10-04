"use strict";

function weekStartISO() {
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
}

function countRecentWorkouts(history, daysBack) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffISO = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
  return (Array.isArray(history) ? history : []).filter((entry) => entry && entry.date >= cutoffISO).length;
}

function buildCoachingInsights(profile = {}, workoutHistory = [], plan = null) {
  const history = Array.isArray(workoutHistory) ? workoutHistory : [];
  const target = Number(profile.prescribedFrequency) || 3;
  const thisWeek = history.filter((entry) => entry && entry.date >= weekStartISO()).length;
  const last7 = countRecentWorkouts(history, 6);
  const prior7 = countRecentWorkouts(history, 13) - last7;
  const insights = [];

  if (!history.length) {
    insights.push({
      tone: "neutral",
      title: "Start Your Routine",
      body: "You have no workouts logged yet. Aim for 2–3 sessions this week to build momentum."
    });
  }

  const behind = Math.max(0, target - thisWeek);
  if (behind > 0) {
    insights.push({
      tone: "warning",
      title: "You’re behind your weekly target",
      body: `${behind} more workout${behind === 1 ? "" : "s"} this week will get you back on pace.`
    });
  }

  if (thisWeek >= target && history.length >= 3) {
    insights.push({
      tone: "success",
      title: "Momentum is building",
      body: `You’ve hit ${thisWeek} workouts this week. Keep the streak alive and stay consistent.`
    });
  } else if (last7 > prior7 && history.length >= 2) {
    insights.push({
      tone: "success",
      title: "Consistency is improving",
      body: `You’ve logged ${last7} workouts in the last 7 days, which is a strong step forward.`
    });
  }

  if (!insights.length) {
    insights.push({
      tone: "neutral",
      title: "Keep it steady",
      body: "You’re on a good rhythm. Keep your weekly plan consistent and protect your recovery days."
    });
  }

  return insights.slice(0, 3);
}

function coachingInsightsHTML(profile, workoutHistory, plan) {
  const insights = buildCoachingInsights(profile || {}, workoutHistory || [], plan || null);
  return `
    <div class="card">
      <div class="eyebrow">${typeof iconHTML === "function" ? iconHTML("sparkles") : ""}<span>Coach</span></div>
      <div class="insight-stack">
        ${insights.map((insight) => `
          <div class="insight-item insight-${insight.tone}">
            <strong>${escapeHtml(insight.title)}</strong>
            <p class="muted">${escapeHtml(insight.body)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}
