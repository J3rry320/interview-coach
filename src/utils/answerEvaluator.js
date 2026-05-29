import { generateStructuredOutput } from "../providers/groq.js";
import { evaluateAnswerPrompt } from "./evaluateAnswerPrompt.js";

const SYSTEM_PROMPT = `
You are a senior interviewer and evaluator.
Always return valid JSON.
`;

export async function evaluateAnswer({
  role,
  question,
  expectedTopics,
  answer,
}) {
  return generateStructuredOutput({
    system: SYSTEM_PROMPT,
    user: evaluateAnswerPrompt({
      role,
      question,
      expectedTopics,
      candidateAnswer: answer,
    }),
    temperature: 0.2,
  });
}
