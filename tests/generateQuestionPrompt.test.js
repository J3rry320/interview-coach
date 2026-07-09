import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateQuestionPrompt } from "../src/utils/generateQuestionPrompt.js";

describe("generateQuestionPrompt", () => {
  test("generates prompt with focus areas and context data", () => {
    const result = generateQuestionPrompt({
      role: "Frontend Engineer",
      level: "mid",
      focusAreas: "React, Redux",
      contextData: "Candidate scored 90 last time.",
      askedCount: 1
    });

    assert.match(result, /ROLE:\nFrontend Engineer/);
    assert.match(result, /LEVEL:\nmid/);
    assert.match(result, /FOCUS AREAS/);
    assert.match(result, /Prioritize asking questions specifically related/);
    assert.match(result, /Candidate scored 90 last time\./);
    assert.match(result, /CURRENT QUESTION NUMBER:\n2/);
  });

  test("generates prompt without focus areas and without context data", () => {
    const result = generateQuestionPrompt({
      role: "Backend Engineer",
      level: "senior",
      focusAreas: "",
      contextData: "",
      askedCount: 0
    });

    assert.match(result, /ROLE:\nBackend Engineer/);
    assert.match(result, /LEVEL:\nsenior/);
    assert.doesNotMatch(result, /FOCUS AREAS/);
    assert.match(result, /Vary topics broadly/);
    assert.match(result, /No history available\./);
    assert.match(result, /CURRENT QUESTION NUMBER:\n1/);
  });
});
