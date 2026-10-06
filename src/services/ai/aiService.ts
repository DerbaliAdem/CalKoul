import { nutritionAssistantInstructions } from "./prompts";
import type { AskAssistantInput } from "./aiTypes";

type AssistantResponse = { answer?: unknown };

export async function askNutritionAssistant({ question, context, signal }: AskAssistantInput): Promise<string> {
  const baseUrl = process.env.EXPO_PUBLIC_CALKOUL_API_URL?.trim();
  if (!baseUrl) throw new Error("not-configured");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/ai/nutrition-assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ question, context, instructions: nutritionAssistantInstructions }),
    signal,
  });
  if (!response.ok) throw new Error(`assistant-request-${response.status}`);
  const payload = (await response.json()) as AssistantResponse;
  if (typeof payload.answer !== "string" || !payload.answer.trim()) throw new Error("assistant-invalid-response");
  return payload.answer.trim();
}
