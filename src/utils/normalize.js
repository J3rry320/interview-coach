// Normalize Question Object
export function normalizeQuestion(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      question: "",
      category: "General",
      difficulty: "medium",
      expectedTopics: [],
    };
  }

  const normalized = {};

  // Find question key
  normalized.question = raw.question || raw.Question || raw.text || raw.prompt || "";
  
  // Find category
  normalized.category = raw.category || raw.Category || "General";
  
  // Find difficulty
  let diff = String(raw.difficulty || raw.Difficulty || "medium").toLowerCase();
  if (!["easy", "medium", "hard"].includes(diff)) {
    diff = "medium";
  }
  normalized.difficulty = diff;
  
  // Find expectedTopics
  const topics = raw.expectedTopics || raw.expected_topics || raw.expectedTopicsList || raw.topics || [];
  normalized.expectedTopics = Array.isArray(topics) ? topics.map(String) : [];

  return normalized;
}

// Normalize Evaluation Object
export function normalizeEvaluation(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      score: 50,
      verdict: "partial",
      feedback: "Failed to evaluate answer properly.",
      strengths: [],
      missingPoints: [],
      idealAnswer: "",
    };
  }

  const normalized = {};

  // Find score
  let score = Number(raw.score !== undefined ? raw.score : raw.Score);
  if (isNaN(score)) score = 50;
  normalized.score = Math.max(0, Math.min(100, score));

  // Find verdict
  let verdict = String(raw.verdict || raw.Verdict || "partial").toLowerCase();
  if (!["correct", "partial", "incorrect"].includes(verdict)) {
    if (score >= 75) verdict = "correct";
    else if (score >= 50) verdict = "partial";
    else verdict = "incorrect";
  }
  normalized.verdict = verdict;

  // Find feedback
  normalized.feedback = raw.feedback || raw.Feedback || "";

  // Find strengths
  const strengths = raw.strengths || raw.Strengths || raw.strengthsList || [];
  normalized.strengths = Array.isArray(strengths) ? strengths.map(String) : [];

  // Find missingPoints
  const missing = raw.missingPoints || raw.missing_points || raw.missingPointsList || raw.missing || raw.improvements || raw.Improvements || [];
  normalized.missingPoints = Array.isArray(missing) ? missing.map(String) : [];

  // Find idealAnswer
  normalized.idealAnswer = raw.idealAnswer || raw.ideal_answer || raw.idealAnswerGuide || raw.ideal || "";

  return normalized;
}
