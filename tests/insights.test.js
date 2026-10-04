"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadGlobal } = require("./load-global");

loadGlobal("js/insights.js");

test("buildCoachingInsights: starts a no-workout user with a simple next step", () => {
  const insights = buildCoachingInsights({ prescribedFrequency: 3 }, [], null);

  assert.ok(insights.length > 0);
  assert.match(insights[0].title, /Start|Routine|Streak/i);
  assert.match(insights[0].body, /workout|session|week/i);
});

test("buildCoachingInsights: warns when the user is behind their weekly target", () => {
  const history = [
    { date: "2026-09-28", durationMin: 30 },
    { date: "2026-09-29", durationMin: 30 },
  ];

  const insights = buildCoachingInsights({ prescribedFrequency: 3 }, history, null);
  const behind = insights.find((item) => item.tone === "warning");

  assert.ok(behind);
  assert.match(behind.title, /behind|target|frequency/i);
});

test("buildCoachingInsights: celebrates momentum when the user is consistent", () => {
  const today = new Date();
  const iso = (offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const history = [
    { date: iso(6), durationMin: 30 },
    { date: iso(5), durationMin: 30 },
    { date: iso(4), durationMin: 30 },
    { date: iso(3), durationMin: 30 },
    { date: iso(2), durationMin: 30 },
    { date: iso(1), durationMin: 30 },
  ];

  const insights = buildCoachingInsights({ prescribedFrequency: 3 }, history, null);
  const positive = insights.find((item) => item.tone === "success");

  assert.ok(positive);
  assert.match(positive.title, /momentum|consistency|strong|steady/i);
});
