import { generateStructuredOutput } from "../providers/groq.js";
import { generateQuestionPrompt } from "./generateQuestionPrompt.js";

const SYSTEM_PROMPT = `
You are an expert technical interviewer.
Always return valid JSON.
`;

export async function generateQuestion(session) {
  return generateStructuredOutput({
    system: SYSTEM_PROMPT,
    user: generateQuestionPrompt({
      role: session.role,
      level: session.level,
      previousQuestions: session.questions?.map((q) => q.question) || [],
      askedCount: session.questions?.length || 0,
    }),
  });
}
