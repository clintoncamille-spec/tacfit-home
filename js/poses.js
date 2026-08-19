// Exercise pose art. Every built-in exercise's `pose` field names a PNG in
// icons/poses/ (photorealistic 3D-render style, transparent background) —
// poseHTML() is the one place that decides image vs. fallback, so nothing else
// needs to know which poses have real art. User-added custom exercises (see
// saveCustomExercise in app.js) always get pose:"custom", which has no photo —
// POSES.custom is a small hand-drawn SVG fallback, styled via currentColor so
// it follows the app theme like the rest of the icon system.
const POSE_IMAGE_KEYS = new Set([
  "pushupBottom", "pushupTop", "pullup", "invertedRow", "dip", "squatBottom", "lunge",
  "stepUp", "gluteBridge", "wallSit", "standing", "plank", "sidePlank", "situp",
  "flutterKick", "superman", "mountainClimber", "burpeeJump", "jumpingJack", "bearCrawl",
]);

const POSES = {
  custom: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34"/><line x1="50" y1="34" x2="50" y2="66"/><line x1="34" y1="50" x2="66" y2="50"/></svg>`,
};

function poseHTML(poseKey) {
  if (POSE_IMAGE_KEYS.has(poseKey)) {
    return `<img class="pose-img" src="icons/poses/${poseKey}.png" alt="" loading="lazy">`;
  }
  return POSES[poseKey] || POSES.custom;
}
