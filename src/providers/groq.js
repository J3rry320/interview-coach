import "dotenv/config";
import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export async function generateStructuredOutput({
  system,
  user,
  model = DEFAULT_MODEL,
  temperature = 0.7,
}) {
  const completion = await groq.chat.completions.create({
    model,
    temperature,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: system,
      },
      {
        role: "user",
        content: user,
      },
    ],
  });

  return JSON.parse(completion.choices[0]?.message?.content || "{}");
}
