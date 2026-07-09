import Anthropic from "@anthropic-ai/sdk";

import { buildBriefPrompt, buildSummaryPrompt } from "@/lib/ai/prompts";
import { generateMockBrief, generateMockSummary } from "@/lib/ai/mock";
import type {
  BriefGenerationInput,
  BriefGenerationResult,
  SummaryGenerationInput,
  SummaryGenerationResult,
} from "@/types";

const AI_MODEL = process.env.AI_MODEL || "claude-sonnet-5";

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const jsonSlice = start >= 0 && end >= 0 ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(jsonSlice) as T;
}

async function callClaude(prompt: string): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("NO_AI_CLIENT");

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Empty AI response");
  }
  return textBlock.text;
}

/**
 * Generates a pre-meeting prep brief. Falls back to a deterministic mock
 * generator when no ANTHROPIC_API_KEY is configured, so the product is
 * fully explorable in local development without an AI provider key.
 */
export async function generateMeetingBrief(
  input: BriefGenerationInput
): Promise<BriefGenerationResult> {
  const client = getClient();
  if (!client) return generateMockBrief(input);

  try {
    const raw = await callClaude(buildBriefPrompt(input));
    return extractJson<BriefGenerationResult>(raw);
  } catch (error) {
    console.error("[ai] brief generation failed, falling back to mock", error);
    return generateMockBrief(input);
  }
}

/**
 * Generates a post-meeting follow-up pack (summary, decisions, action
 * items, and a draft follow-up email). Same mock fallback strategy as
 * generateMeetingBrief.
 */
export async function generateFollowUp(
  input: SummaryGenerationInput
): Promise<SummaryGenerationResult> {
  const client = getClient();
  if (!client) return generateMockSummary(input);

  try {
    const raw = await callClaude(buildSummaryPrompt(input));
    return extractJson<SummaryGenerationResult>(raw);
  } catch (error) {
    console.error("[ai] summary generation failed, falling back to mock", error);
    return generateMockSummary(input);
  }
}
