export function evaluateAnswerPrompt({
  role,
  question,
  expectedTopics,
  candidateAnswer,
}) {
  return `
You are a strict technical interviewer.

ROLE:
${role}

QUESTION:
${question}

EXPECTED TOPICS:
${expectedTopics.join(", ")}

CANDIDATE ANSWER:
${candidateAnswer}

Evaluate:

1. Technical correctness
2. Completeness
3. Communication clarity
4. Missing concepts
5. Confidence level

Return ONLY valid JSON.

{
  "score": 0,
  "verdict": "correct|partial|incorrect",
  "feedback": "short feedback",
  "strengths": [
    "..."
  ],
  "missingPoints": [
    "..."
  ],
  "idealAnswer": "Detailed ideal answer",
  "followUpQuestion": "optional follow up question"
}

SCORING:

90-100 = Excellent
75-89 = Good
50-74 = Partial
0-49 = Incorrect

Be strict.
`;
}
