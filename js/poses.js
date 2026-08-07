// Minimalist stick-figure pictograms, one per movement pattern.
// Reused across exercises to keep the app fully offline (no external image assets).
// All strokes use currentColor so they follow the app theme.
const POSES = {
  standing: `<svg viewBox="0 0 100 100"><circle cx="50" cy="18" r="9"/><line x1="50" y1="27" x2="50" y2="62"/><line x1="50" y1="38" x2="30" y2="52"/><line x1="50" y1="38" x2="70" y2="52"/><line x1="50" y1="62" x2="35" y2="90"/><line x1="50" y1="62" x2="65" y2="90"/></svg>`,

  pushupTop: `<svg viewBox="0 0 100 100"><circle cx="18" cy="42" r="8"/><line x1="24" y1="46" x2="80" y2="70"/><line x1="30" y1="50" x2="20" y2="70"/><line x1="55" y1="58" x2="45" y2="76"/><line x1="24" y1="46" x2="24" y2="66"/><line x1="80" y1="70" x2="80" y2="88"/></svg>`,

  pushupBottom: `<svg viewBox="0 0 100 100"><circle cx="16" cy="60" r="8"/><line x1="22" y1="62" x2="82" y2="70"/><line x1="30" y1="63" x2="26" y2="78"/><line x1="55" y1="66" x2="52" y2="80"/><line x1="22" y1="62" x2="10" y2="78"/><line x1="82" y1="70" x2="82" y2="88"/></svg>`,

  squatTop: `<svg viewBox="0 0 100 100"><circle cx="50" cy="16" r="9"/><line x1="50" y1="25" x2="50" y2="58"/><line x1="50" y1="34" x2="28" y2="26"/><line x1="50" y1="34" x2="72" y2="26"/><line x1="50" y1="58" x2="34" y2="90"/><line x1="50" y1="58" x2="66" y2="90"/></svg>`,

  squatBottom: `<svg viewBox="0 0 100 100"><circle cx="50" cy="34" r="9"/><line x1="50" y1="43" x2="50" y2="64"/><line x1="50" y1="50" x2="26" y2="46"/><line x1="50" y1="50" x2="74" y2="46"/><line x1="50" y1="64" x2="30" y2="66"/><line x1="30" y1="66" x2="34" y2="90"/><line x1="50" y1="64" x2="70" y2="66"/><line x1="70" y1="66" x2="66" y2="90"/></svg>`,

  lunge: `<svg viewBox="0 0 100 100"><circle cx="46" cy="16" r="9"/><line x1="46" y1="25" x2="50" y2="55"/><line x1="48" y1="34" x2="26" y2="30"/><line x1="48" y1="34" x2="70" y2="44"/><line x1="50" y1="55" x2="26" y2="64"/><line x1="26" y1="64" x2="30" y2="90"/><line x1="50" y1="55" x2="74" y2="70"/><line x1="74" y1="70" x2="60" y2="90"/></svg>`,

  plank: `<svg viewBox="0 0 100 100"><circle cx="16" cy="56" r="8"/><line x1="22" y1="58" x2="84" y2="66"/><line x1="30" y1="59" x2="26" y2="76"/><line x1="22" y1="58" x2="12" y2="74"/><line x1="84" y1="66" x2="84" y2="86"/></svg>`,

  sidePlank: `<svg viewBox="0 0 100 100"><circle cx="18" cy="48" r="8"/><line x1="24" y1="50" x2="82" y2="58"/><line x1="24" y1="50" x2="14" y2="70"/><line x1="50" y1="54" x2="50" y2="20"/><line x1="82" y1="58" x2="88" y2="80"/></svg>`,

  situp: `<svg viewBox="0 0 100 100"><circle cx="60" cy="40" r="8"/><line x1="55" y1="46" x2="34" y2="66"/><line x1="34" y1="66" x2="14" y2="66"/><line x1="34" y1="66" x2="40" y2="86"/><line x1="34" y1="66" x2="18" y2="86"/><line x1="60" y1="40" x2="76" y2="30"/></svg>`,

  pullup: `<svg viewBox="0 0 100 100"><line x1="10" y1="14" x2="90" y2="14"/><circle cx="50" cy="30" r="9"/><line x1="30" y1="14" x2="40" y2="34"/><line x1="70" y1="14" x2="60" y2="34"/><line x1="50" y1="39" x2="50" y2="66"/><line x1="50" y1="50" x2="38" y2="62"/><line x1="50" y1="50" x2="62" y2="62"/><line x1="50" y1="66" x2="40" y2="90"/><line x1="50" y1="66" x2="60" y2="90"/></svg>`,

  invertedRow: `<svg viewBox="0 0 100 100"><line x1="10" y1="24" x2="90" y2="24"/><circle cx="70" cy="44" r="8"/><line x1="64" y1="48" x2="20" y2="60"/><line x1="50" y1="24" x2="50" y2="52"/><line x1="20" y1="60" x2="14" y2="80"/><line x1="20" y1="60" x2="26" y2="80"/></svg>`,

  jumpingJack: `<svg viewBox="0 0 100 100"><circle cx="50" cy="18" r="9"/><line x1="50" y1="27" x2="50" y2="58"/><line x1="50" y1="34" x2="20" y2="14"/><line x1="50" y1="34" x2="80" y2="14"/><line x1="50" y1="58" x2="24" y2="88"/><line x1="50" y1="58" x2="76" y2="88"/></svg>`,

  mountainClimber: `<svg viewBox="0 0 100 100"><circle cx="18" cy="42" r="8"/><line x1="24" y1="46" x2="80" y2="68"/><line x1="30" y1="50" x2="20" y2="70"/><line x1="55" y1="58" x2="65" y2="42"/><line x1="65" y1="42" x2="78" y2="46"/><line x1="24" y1="46" x2="24" y2="66"/></svg>`,

  burpeeJump: `<svg viewBox="0 0 100 100"><circle cx="50" cy="12" r="9"/><line x1="50" y1="21" x2="50" y2="50"/><line x1="50" y1="26" x2="24" y2="10"/><line x1="50" y1="26" x2="76" y2="10"/><line x1="50" y1="50" x2="30" y2="70"/><line x1="50" y1="50" x2="70" y2="70"/><line x1="30" y1="70" x2="34" y2="92"/><line x1="70" y1="70" x2="66" y2="92"/></svg>`,

  superman: `<svg viewBox="0 0 100 100"><circle cx="16" cy="52" r="8"/><line x1="22" y1="52" x2="80" y2="46"/><line x1="30" y1="51" x2="14" y2="36"/><line x1="80" y1="46" x2="94" y2="34"/><line x1="80" y1="46" x2="94" y2="58"/></svg>`,

  dip: `<svg viewBox="0 0 100 100"><line x1="10" y1="40" x2="30" y2="40"/><line x1="70" y1="40" x2="90" y2="40"/><circle cx="50" cy="30" r="9"/><line x1="50" y1="39" x2="50" y2="60"/><line x1="50" y1="45" x2="30" y2="40"/><line x1="50" y1="45" x2="70" y2="40"/><line x1="50" y1="60" x2="40" y2="88"/><line x1="50" y1="60" x2="60" y2="88"/></svg>`,

  stepUp: `<svg viewBox="0 0 100 100"><rect x="55" y="70" width="35" height="14"/><circle cx="55" cy="30" r="9"/><line x1="55" y1="39" x2="58" y2="62"/><line x1="55" y1="46" x2="35" y2="38"/><line x1="55" y1="46" x2="75" y2="54"/><line x1="58" y1="62" x2="70" y2="70"/><line x1="58" y1="62" x2="40" y2="86"/></svg>`,

  bearCrawl: `<svg viewBox="0 0 100 100"><circle cx="80" cy="36" r="8"/><line x1="74" y1="40" x2="20" y2="56"/><line x1="30" y1="52" x2="14" y2="78"/><line x1="60" y1="47" x2="70" y2="78"/><line x1="74" y1="40" x2="86" y2="60"/></svg>`,

  flutterKick: `<svg viewBox="0 0 100 100"><circle cx="18" cy="56" r="8"/><line x1="24" y1="56" x2="60" y2="56"/><line x1="60" y1="56" x2="80" y2="44"/><line x1="60" y1="56" x2="86" y2="66"/><line x1="24" y1="56" x2="10" y2="70"/></svg>`,

  gluteBridge: `<svg viewBox="0 0 100 100"><circle cx="14" cy="66" r="8"/><line x1="20" y1="64" x2="55" y2="50"/><line x1="55" y1="50" x2="85" y2="66"/><line x1="55" y1="50" x2="55" y2="86"/><line x1="20" y1="64" x2="12" y2="86"/></svg>`,

  wallSit: `<svg viewBox="0 0 100 100"><line x1="18" y1="10" x2="18" y2="90"/><circle cx="34" cy="26" r="8"/><line x1="30" y1="34" x2="30" y2="60"/><line x1="30" y1="60" x2="55" y2="60"/><line x1="55" y1="60" x2="55" y2="88"/></svg>`,

  // Generic fallback for user-added custom exercises (no hand-drawn pose available).
  custom: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34"/><line x1="50" y1="34" x2="50" y2="66"/><line x1="34" y1="50" x2="66" y2="50"/></svg>`,
};
