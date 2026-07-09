import { listAllSessions } from "./session.js";

/**
 * Builds a compact context string from past sessions and the current session's history
 * to avoid blowing up the LLM token limit.
 */
export async function buildInterviewContext(currentSession) {
  let contextChunks = [];

  // 1. Current Session Context (Prioritize this)
  if (currentSession.questions && currentSession.questions.length > 0) {
    contextChunks.push("CURRENT SESSION HISTORY:");
    // Take up to the last 5 questions to keep token count reasonable
    const recentQuestions = currentSession.questions.slice(-5);
    recentQuestions.forEach((q, idx) => {
      let chunk = `- Q: ${q.question}\n`;
      if (q.evaluation) {
        chunk += `  Score: ${q.evaluation.score}/100. Feedback: ${q.evaluation.feedback}\n`;
        if (q.evaluation.missingPoints && q.evaluation.missingPoints.length > 0) {
          chunk += `  Missed: ${q.evaluation.missingPoints.join(", ")}\n`;
        }
      }
      contextChunks.push(chunk);
    });
  }

  // 2. Past Sessions Context (Same Role)
  try {
    const allSessions = await listAllSessions();
    const pastSessions = allSessions
      .filter((s) => s.id !== currentSession.id && s.role === currentSession.role && s.status === "completed")
      .slice(0, 3); // Get up to 3 most recent past sessions for this role

    if (pastSessions.length > 0) {
      contextChunks.push("PAST SESSIONS PERFORMANCE (Same Role):");
      pastSessions.forEach((s) => {
        const avgScore = s.totalScore / (s.completedQuestions || 1);
        contextChunks.push(`- Date: ${new Date(s.createdAt).toISOString().split('T')[0]}, Level: ${s.level}, Avg Score: ${Math.round(avgScore)}/100`);
        // Extract common weaknesses from the worst questions in that session
        const weakQuestions = s.questions.filter(q => q.evaluation && q.evaluation.score < 70).slice(0, 2);
        if (weakQuestions.length > 0) {
          const weaknesses = weakQuestions.map(q => q.category || "General").join(", ");
          contextChunks.push(`  Struggled with topics: ${weaknesses}`);
        }
      });
    }
  } catch (error) {
    // Ignore errors reading past sessions
  }

  return contextChunks.join("\n");
}
