// BMI + strength-level analytics. Deliberately simple, transparent formulas —
// this is a home-fitness estimate, not a medical assessment.

function computeBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function bmiCategory(bmi) {
  if (bmi == null) return { label: "Unknown", tone: "neutral" };
  if (bmi < 18.5) return { label: "Underweight", tone: "warn" };
  if (bmi < 25) return { label: "Healthy Range", tone: "good" };
  if (bmi < 30) return { label: "Overweight", tone: "warn" };
  return { label: "Obese Range", tone: "bad" };
}

// General bodyweight-strength benchmarks (untrained -> elite), unisex simplified scale.
const PUSHUP_BENCHMARKS = [0, 5, 15, 30, 45, 60];
const PULLUP_BENCHMARKS = [0, 1, 4, 8, 14, 20];
const LEVEL_LABELS = ["Untrained", "Novice", "Beginner", "Intermediate", "Advanced", "Elite"];

function strengthLevel(count, benchmarks) {
  let idx = 0;
  for (let i = 0; i < benchmarks.length; i++) if (count >= benchmarks[i]) idx = i;
  return idx;
}

function fitnessScore(pushups, pullups) {
  const pIdx = strengthLevel(pushups || 0, PUSHUP_BENCHMARKS);
  const uIdx = strengthLevel(pullups || 0, PULLUP_BENCHMARKS);
  const avgIdx = (pIdx + uIdx) / 2;
  return { pushupLevel: LEVEL_LABELS[pIdx], pullupLevel: LEVEL_LABELS[uIdx], overallLevel: LEVEL_LABELS[Math.round(avgIdx)], score: Math.round((avgIdx / 5) * 100) };
}

// Cross-reference fitness score against BMI category for a plain-language read.
function fitnessVsBmiInsight(bmi, fitScore) {
  const cat = bmiCategory(bmi).label;
  if (bmi == null) return "Log your height and weight to see this comparison.";
  if (cat === "Healthy Range" && fitScore.score >= 50)
    return "Your BMI and strength level are both solid — focus on progressive overload to keep advancing.";
  if (cat === "Healthy Range" && fitScore.score < 50)
    return "Your BMI is in a healthy range, but strength is still building — this plan will prioritize reps and consistency over cutting.";
  if ((cat === "Overweight" || cat === "Obese Range") && fitScore.score >= 50)
    return "You're carrying more weight than the BMI chart likes, but your strength numbers are solid — likely a good amount of muscle. Fat-loss focused conditioning will sharpen results.";
  if ((cat === "Overweight" || cat === "Obese Range") && fitScore.score < 50)
    return "Both BMI and strength suggest starting conservatively — this plan leans on lower-impact moves and gradually increases volume to protect joints while building a base.";
  if (cat === "Underweight")
    return "BMI is on the low side — pair this strength plan with adequate calories and protein to build lean mass safely.";
  return "Keep logging weight and strength tests to track how these move together.";
}

function bmr_estimate(weightKg, heightCm, age) {
  // Mifflin-St Jeor, gender-neutral midpoint (no gender collected in profile).
  if (!weightKg || !heightCm || !age) return null;
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
}
