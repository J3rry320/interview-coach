import { generateStructuredOutput } from "../providers/llm.js";
import { evaluateAnswerPrompt } from "./evaluateAnswerPrompt.js";
import { normalizeEvaluation } from "./normalize.js";

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
  const raw = await generateStructuredOutput({
    system: SYSTEM_PROMPT,
    user: evaluateAnswerPrompt({
      role,
      question,
      expectedTopics,
      candidateAnswer: answer,
    }),
    temperature: 0.2,
  });

  return normalizeEvaluation(raw);
}
