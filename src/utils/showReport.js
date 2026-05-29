import { loadSession } from "../utils/session.js";

export async function showFinalReport() {
  const session = await loadSession();

  const average = Math.round(session.totalScore / session.questions.length);

  console.log("\n");
  console.log("Interview Complete");
  console.log("------------------");

  console.log(`Role: ${session.role}`);

  console.log(`Questions: ${session.questions.length}`);

  console.log(`Average Score: ${average}`);

  console.log("");

  session.questions.forEach((q, index) => {
    console.log(`${index + 1}. ${q.evaluation.score}`);
  });
}
