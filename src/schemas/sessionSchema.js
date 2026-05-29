import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  category: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  expectedTopics: z.array(z.string()),

  answer: z.string().optional(),

  evaluation: z
    .object({
      score: z.number(),
      verdict: z.enum(["correct", "partial", "incorrect"]),
      feedback: z.string(),
      strengths: z.array(z.string()),
      missingPoints: z.array(z.string()),
      idealAnswer: z.string(),
      followUpQuestion: z.string().optional(),
    })
    .optional(),
});

export const SessionSchema = z.object({
  id: z.string(),

  role: z.string(),

  level: z.enum(["junior", "mid", "senior"]),

  createdAt: z.string(),

  status: z.enum(["active", "completed"]),

  currentQuestion: z.number(),

  totalScore: z.number(),

  questions: z.array(QuestionSchema),
});

export default SessionSchema;
