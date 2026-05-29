export function generateQuestionPrompt({
  role,
  level,
  previousQuestions = [],
  askedCount = 0,
}) {
  return `
You are a senior technical interviewer.

Generate ONE interview question.

ROLE:
${role}

LEVEL:
${level}

QUESTIONS ALREADY ASKED:
${previousQuestions.join("\n") || "None"}

RULES:

1. Do not repeat previous questions.
2. Difficulty should match the level.
3. Ask practical and realistic questions.
4. Prefer questions that reveal actual understanding.
5. Avoid trivia.
6. Question must be concise.
7. Return ONLY valid JSON.

JSON FORMAT:

{
  "question": "string",
  "category": "string",
  "difficulty": "easy|medium|hard",
  "expectedTopics": [
    "topic1",
    "topic2"
  ]
}

CURRENT QUESTION NUMBER:
${askedCount + 1}
`;
}
