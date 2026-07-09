import { generateStructuredOutput } from "../providers/llm.js";
import { evaluateAnswerPrompt } from "./evaluateAnswerPrompt.js";
import { normalizeEvaluation } from "./normalize.js";
import { buildInterviewContext } from "./contextBuilder.js";
import { validateCandidateInput } from "./guardrails.js";

const SYSTEM_PROMPT = `
You are a senior interviewer and evaluator.
Always return valid JSON.
`;

export async function evaluateAnswer({
  role,
  question,
  expectedTopics,
  answer,
  session,
}) {
  const validation = validateCandidateInput(answer);
  if (!validation.isValid) {
    return {
      score: 0,
      verdict: "incorrect",
      feedback: `Validation Flagged: ${validation.reason}`,
      strengths: [],
      improvements: [validation.reason],
      missingPoints: [validation.reason],
      idealAnswer: "Please write a professional, relevant response to the interview question."
    };
  }

  let contextData = "";
  if (session) {
    contextData = await buildInterviewContext(session);
  }

  const raw = await generateStructuredOutput({
    system: SYSTEM_PROMPT,
    user: evaluateAnswerPrompt({
      role,
      question,
      expectedTopics,
      candidateAnswer: answer,
      contextData,
    }),
    temperature: 0.2,
  });

  return normalizeEvaluation(raw);
}
