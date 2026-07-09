/**
 * Basic guardrail checks to protect the interview coach from prompt injections,
 * malicious inputs, gibberish, and irrelevant responses.
 */

const PROMPT_INJECTION_KEYWORDS = [
  "ignore previous",
  "ignore all previous",
  "ignore instructions",
  "system override",
  "developer mode",
  "you are now a",
  "do not evaluate",
  "always return score",
  "ignore the question",
  "forget your instructions",
  "bypass filter",
  "override verdict",
  "give me 100"
];

const PROFANITY_WORDS = [
  "abuse", "harass", "kill yourself", "kys", "threaten" // Basic safety list, easily expandable
];

export function validateCandidateInput(answer) {
  if (!answer || typeof answer !== "string") {
    return {
      isValid: false,
      reason: "Answer must be a valid text string."
    };
  }

  const trimmed = answer.trim().toLowerCase();

  // 1. Length Check
  if (trimmed.length < 5) {
    return {
      isValid: false,
      reason: "Your answer is too short. Please write a complete response."
    };
  }

  // 2. Prompt Injection Keywords Check
  for (const keyword of PROMPT_INJECTION_KEYWORDS) {
    if (trimmed.includes(keyword)) {
      return {
        isValid: false,
        reason: "Adversarial input detected. Please stay focused on the interview question."
      };
    }
  }

  // 3. Simple Gibberish / Repetitive Check (e.g. "aaaaa" or "asdfasdf")
  const repeatPattern = /(.)\1{4,}/; // 5 identical characters repeating
  if (repeatPattern.test(trimmed)) {
    return {
      isValid: false,
      reason: "Input contains repetitive characters. Please type a meaningful response."
    };
  }

  // 4. Basic Safety Guardrail
  for (const word of PROFANITY_WORDS) {
    if (trimmed.includes(word)) {
      return {
        isValid: false,
        reason: "Input flagged by safety filters. Please maintain professional communication."
      };
    }
  }

  return { isValid: true };
}
