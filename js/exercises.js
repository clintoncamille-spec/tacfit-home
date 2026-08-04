// Bodyweight, military-calisthenics style exercise library. No equipment required.
// scale: {beginner:[sets,reps], intermediate:[sets,reps], advanced:[sets,reps]} -- reps=seconds for holds (isHold:true)
const EXERCISES = [
  {
    id: "pushup_standard", name: "Standard Push-Up", category: "upper", pose: "pushupBottom",
    targets: ["chest", "arms"], avoidInjuries: ["wrist", "shoulder"],
    scale: { beginner: [3, 8], intermediate: [4, 15], advanced: [5, 25] },
    steps: ["Hands under shoulders, body in a straight line", "Lower chest to floor, elbows ~45°", "Press back up to full extension", "Keep core braced the whole rep"],
  },
  {
    id: "pushup_incline", name: "Incline Push-Up", category: "upper", pose: "pushupTop",
    targets: ["chest", "arms"], avoidInjuries: [],
    scale: { beginner: [3, 10], intermediate: [3, 15], advanced: [4, 20] },
    steps: ["Hands on a sturdy chair/counter, body straight", "Lower chest toward the edge", "Press back up", "Easier variant — good for building base strength or protecting wrists/shoulders"],
  },
  {
    id: "pushup_diamond", name: "Diamond Push-Up", category: "upper", pose: "pushupBottom",
    targets: ["arms", "chest"], avoidInjuries: ["wrist", "shoulder", "elbow"],
    scale: { beginner: [2, 5], intermediate: [3, 10], advanced: [4, 18] },
    steps: ["Hands together under chest, thumbs and index fingers touching", "Lower with elbows close to body", "Press up — heavy triceps emphasis"],
  },
  {
    id: "pullup", name: "Pull-Up", category: "upper", pose: "pullup",
    targets: ["back", "arms"], avoidInjuries: ["shoulder", "elbow"],
    scale: { beginner: [3, 2], intermediate: [4, 6], advanced: [5, 10] },
    steps: ["Overhand grip, slightly wider than shoulders", "Pull chin over the bar", "Lower under control to a full hang", "No bar? Use a sturdy tree branch or playground bar"],
  },
  {
    id: "chinup", name: "Chin-Up", category: "upper", pose: "pullup",
    targets: ["back", "arms"], avoidInjuries: ["shoulder", "elbow"],
    scale: { beginner: [3, 3], intermediate: [4, 7], advanced: [5, 12] },
    steps: ["Underhand grip, shoulder width", "Pull chin over the bar", "Lower under control", "Easier than pull-ups — good starting point for back strength"],
  },
  {
    id: "invertedrow", name: "Inverted Row (table/low bar)", category: "upper", pose: "invertedRow",
    targets: ["back"], avoidInjuries: [],
    scale: { beginner: [3, 8], intermediate: [4, 12], advanced: [5, 18] },
    steps: ["Lie under a sturdy table edge or low bar", "Grip edge, body straight, heels on floor", "Pull chest to the edge", "No pull-up bar needed — great regression"],
  },
  {
    id: "dips_chair", name: "Chair/Bench Dips", category: "upper", pose: "dip",
    targets: ["arms", "chest"], avoidInjuries: ["shoulder", "elbow", "wrist"],
    scale: { beginner: [3, 8], intermediate: [4, 14], advanced: [5, 20] },
    steps: ["Hands on chair edge behind you, legs extended", "Lower hips straight down", "Press back up", "Bend knees to make it easier"],
  },
  {
    id: "squat_bodyweight", name: "Bodyweight Squat", category: "lower", pose: "squatBottom",
    targets: ["thighs", "glutes"], avoidInjuries: ["knee"],
    scale: { beginner: [3, 12], intermediate: [4, 20], advanced: [5, 30] },
    steps: ["Feet shoulder width, toes slightly out", "Hips back and down, chest up", "Thighs to at least parallel", "Drive through heels to stand"],
  },
  {
    id: "squat_jump", name: "Jump Squat", category: "lower", pose: "squatBottom",
    targets: ["thighs", "glutes"], avoidInjuries: ["knee", "ankle"],
    scale: { beginner: [3, 6], intermediate: [4, 12], advanced: [5, 20] },
    steps: ["Squat down", "Explode straight up into a jump", "Land soft with bent knees", "Reset and repeat"],
  },
  {
    id: "lunge_reverse", name: "Reverse Lunge", category: "lower", pose: "lunge",
    targets: ["thighs", "glutes"], avoidInjuries: ["knee"],
    scale: { beginner: [3, 8], intermediate: [4, 12], advanced: [5, 16] },
    steps: ["Step one leg back, lower until both knees ~90°", "Front knee stays over ankle, not past toes", "Push through front heel to return", "Alternate legs (reps = per side)"],
  },
  {
    id: "stepup", name: "Step-Up", category: "lower", pose: "stepUp",
    targets: ["thighs", "glutes"], avoidInjuries: ["knee"],
    scale: { beginner: [3, 8], intermediate: [4, 14], advanced: [5, 20] },
    steps: ["Use a sturdy step, stair, or low bench", "Drive up through the lead leg", "Stand tall at the top", "Step down with control, alternate legs"],
  },
  {
    id: "glutebridge", name: "Glute Bridge", category: "lower", pose: "gluteBridge",
    targets: ["glutes", "belly_fat"], avoidInjuries: ["lower_back"],
    scale: { beginner: [3, 12], intermediate: [4, 20], advanced: [5, 30] },
    steps: ["Lie on back, knees bent, feet flat", "Squeeze glutes and lift hips to a straight line", "Pause at the top", "Lower with control"],
  },
  {
    id: "wallsit", name: "Wall Sit", category: "lower", pose: "wallSit", isHold: true,
    targets: ["thighs"], avoidInjuries: ["knee"],
    scale: { beginner: [3, 20], intermediate: [3, 40], advanced: [4, 60] },
    steps: ["Back flat against a wall, thighs parallel to floor", "Knees at 90°, directly over ankles", "Hold — reps shown are seconds", "Breathe steadily throughout"],
  },
  {
    id: "calfraise", name: "Standing Calf Raise", category: "lower", pose: "standing",
    targets: ["thighs"], avoidInjuries: [],
    scale: { beginner: [3, 15], intermediate: [4, 20], advanced: [5, 30] },
    steps: ["Stand tall, feet hip-width (hold a wall/chair for balance if needed)", "Rise up onto your toes as high as possible", "Pause, then lower with control", "Very low joint stress — safe with most injuries"],
  },
  {
    id: "clamshell", name: "Clamshell", category: "lower", pose: "gluteBridge",
    targets: ["glutes"], avoidInjuries: ["hip"],
    scale: { beginner: [3, 12], intermediate: [4, 18], advanced: [5, 25] },
    steps: ["Lie on your side, knees bent ~45°, feet together", "Keeping feet touching, open top knee like a clamshell", "Lower with control", "Repeat all reps, then switch sides"],
  },
  {
    id: "plank_front", name: "Front Plank", category: "core", pose: "plank", isHold: true,
    targets: ["belly_fat", "back"], avoidInjuries: ["lower_back", "wrist"],
    scale: { beginner: [3, 20], intermediate: [3, 45], advanced: [4, 75] },
    steps: ["Forearms and toes on the floor, elbows under shoulders", "Body in one straight line, hips level", "Brace core, don't let hips sag", "Hold — reps shown are seconds"],
  },
  {
    id: "plank_side", name: "Side Plank", category: "core", pose: "sidePlank", isHold: true,
    targets: ["belly_fat", "back"], avoidInjuries: ["lower_back", "shoulder"],
    scale: { beginner: [2, 15], intermediate: [3, 30], advanced: [3, 50] },
    steps: ["Forearm on floor, elbow under shoulder, body straight", "Stack hips and lift them off the ground", "Hold, then repeat on the other side", "Reps shown are seconds per side"],
  },
  {
    id: "situp", name: "Sit-Up", category: "core", pose: "situp",
    targets: ["belly_fat"], avoidInjuries: ["lower_back", "neck"],
    scale: { beginner: [3, 10], intermediate: [4, 20], advanced: [5, 30] },
    steps: ["Knees bent, feet anchored or flat on floor", "Hands lightly behind head or crossed on chest", "Curl all the way up, then lower with control", "Avoid yanking on the neck"],
  },
  {
    id: "bicyclecrunch", name: "Bicycle Crunch", category: "core", pose: "situp",
    targets: ["belly_fat"], avoidInjuries: ["lower_back", "neck"],
    scale: { beginner: [3, 12], intermediate: [4, 20], advanced: [5, 30] },
    steps: ["Lie back, hands behind head, knees up", "Bring opposite elbow to opposite knee", "Extend the other leg out low", "Alternate sides continuously (reps = total)"],
  },
  {
    id: "flutterkick", name: "Flutter Kicks", category: "core", pose: "flutterKick",
    targets: ["belly_fat"], avoidInjuries: ["lower_back"],
    scale: { beginner: [3, 20], intermediate: [4, 30], advanced: [5, 45] },
    steps: ["Lie on back, hands under glutes, legs extended", "Lift legs slightly off the floor", "Kick in a small, fast alternating motion", "Reps shown are seconds"],
  },
  {
    id: "superman", name: "Superman Hold", category: "core", pose: "superman", isHold: true,
    targets: ["back"], avoidInjuries: ["lower_back", "neck"],
    scale: { beginner: [3, 15], intermediate: [3, 30], advanced: [4, 45] },
    steps: ["Lie face down, arms extended in front", "Lift chest, arms and legs off the floor together", "Squeeze glutes and lower back", "Hold, then lower with control"],
  },
  {
    id: "mountainclimber", name: "Mountain Climbers", category: "cardio", pose: "mountainClimber",
    targets: ["belly_fat"], avoidInjuries: ["wrist", "shoulder"],
    scale: { beginner: [3, 16], intermediate: [4, 30], advanced: [5, 45] },
    steps: ["Start in a plank position", "Drive knees toward chest, alternating quickly", "Keep hips low and core tight", "Reps = total knee drives"],
  },
  {
    id: "burpee", name: "Burpee", category: "cardio", pose: "burpeeJump",
    targets: ["belly_fat", "thighs"], avoidInjuries: ["knee", "wrist", "lower_back"],
    scale: { beginner: [3, 5], intermediate: [4, 10], advanced: [5, 18] },
    steps: ["Squat down, place hands on floor", "Jump feet back to a plank, then back in", "Explode up into a jump", "Land soft and repeat"],
  },
  {
    id: "jumpingjack", name: "Jumping Jacks", category: "cardio", pose: "jumpingJack",
    targets: ["belly_fat"], avoidInjuries: ["knee", "ankle"],
    scale: { beginner: [3, 20], intermediate: [4, 35], advanced: [5, 50] },
    steps: ["Start standing, arms at sides", "Jump feet out while raising arms overhead", "Jump back to start", "Keep a steady rhythm"],
  },
  {
    id: "highknees", name: "High Knees", category: "cardio", pose: "mountainClimber",
    targets: ["belly_fat"], avoidInjuries: ["knee"],
    scale: { beginner: [3, 20], intermediate: [4, 35], advanced: [5, 50] },
    steps: ["Jog in place driving knees to hip height", "Pump arms in rhythm", "Stay light on your feet", "Reps shown are seconds"],
  },
  {
    id: "bearcrawl", name: "Bear Crawl", category: "cardio", pose: "bearCrawl",
    targets: ["chest", "belly_fat"], avoidInjuries: ["wrist", "knee"],
    scale: { beginner: [3, 15], intermediate: [4, 25], advanced: [5, 40] },
    steps: ["Hands and feet on floor, knees hovering just above it", "Crawl forward moving opposite hand/foot together", "Keep hips low and core braced", "Reps shown are seconds"],
  },
];

const CATEGORY_LABELS = { upper: "Upper Body", lower: "Lower Body", core: "Core", cardio: "Cardio / Conditioning" };
const INJURY_LABELS = { knee: "Knee", lower_back: "Lower Back", shoulder: "Shoulder", elbow: "Elbow", ankle: "Ankle", wrist: "Wrist", neck: "Neck", hip: "Hip" };
const PROBLEM_AREA_LABELS = { belly_fat: "Belly / “beer belly”", love_handles: "Love Handles", chest: "Chest", arms: "Arms", thighs: "Thighs", back: "Back", glutes: "Glutes" };
