import { generateStructuredOutput } from "../providers/llm.js";
import { generateQuestionPrompt } from "./generateQuestionPrompt.js";
import { normalizeQuestion } from "./normalize.js";
import { buildInterviewContext } from "./contextBuilder.js";

const SYSTEM_PROMPT = `
You are an expert technical interviewer.
Always return valid JSON.
`;

export async function generateQuestion(session) {
  const contextData = await buildInterviewContext(session);

  const raw = await generateStructuredOutput({
    system: SYSTEM_PROMPT,
    user: generateQuestionPrompt({
      role: session.role,
      level: session.level,
      focusAreas: session.focusAreas,
      contextData,
      askedCount: session.questions?.length || 0,
    }),
  });

  return normalizeQuestion(raw);
}
