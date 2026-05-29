import { input, select } from "@inquirer/prompts";

import { createSession } from "../utils/session.js";

import { runInterview } from "../utils/engine.js";

export async function startCommand() {
  const role = await input({
    message: "Role:",
  });

  const difficulty = await select({
    message: "Difficulty:",
    choices: [
      {
        name: "Junior",
        value: "junior",
      },
      {
        name: "Mid",
        value: "mid",
      },
      {
        name: "Senior",
        value: "senior",
      },
    ],
  });

  const totalQuestions = Number(
    await input({
      message: "Number of questions:",
      default: "5",
    }),
  );

  const session = await createSession({
    role,
    level: difficulty,
    totalQuestions,
  });

  await runInterview(session);
}
