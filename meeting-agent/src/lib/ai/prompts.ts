import type { BriefGenerationInput, SummaryGenerationInput } from "@/types";

const TONE_GUIDANCE: Record<string, string> = {
  FORMAL: "formal, precise, and businesslike",
  FRIENDLY: "warm, personable, and conversational",
  CONCISE: "brief, plain, and to the point - short sentences, no filler",
  CONSULTATIVE: "confident and advisory, like a trusted consultant guiding the conversation",
};

export function toneGuidance(tone: string): string {
  return TONE_GUIDANCE[tone] ?? TONE_GUIDANCE.CONSULTATIVE;
}

export function buildBriefPrompt(input: BriefGenerationInput): string {
  return `You are an assistant that prepares busy professionals for meetings.

Meeting: "${input.meetingTitle}"
Time: ${input.startTime}
Description: ${input.meetingDescription || "(none provided)"}

Attendees:
${input.attendees.map((a) => `- ${a.name} <${a.email}>${a.company ? ` (${a.company})` : ""}`).join("\n") || "(none listed)"}

Recent related emails:
${
  input.recentEmails.length
    ? input.recentEmails
        .map((e) => `- From ${e.from}, "${e.subject}": ${e.snippet}`)
        .join("\n")
    : "(no recent email context found)"
}

Prior meeting context:
${input.priorMeetingSummaries.length ? input.priorMeetingSummaries.join("\n---\n") : "(no prior meetings found)"}

Write in a tone that is ${toneGuidance(input.tone)}. The reader's name is ${input.userName}.

Respond with ONLY valid JSON matching this exact shape, no markdown fences, no commentary:
{
  "attendeeContext": [{ "name": string, "email": string, "company": string, "title": string, "notes": string }],
  "companyContext": string,
  "recentEmailContext": [{ "from": string, "subject": string, "snippet": string, "date": string }],
  "priorMeetingContext": string,
  "likelyGoals": string[],
  "suggestedQuestions": string[],
  "risks": string[]
}`;
}

export function buildSummaryPrompt(input: SummaryGenerationInput): string {
  return `You are an assistant that turns raw meeting notes into a clear follow-up pack.

Meeting: "${input.meetingTitle}"
Description: ${input.meetingDescription || "(none provided)"}

Attendees:
${input.attendees.map((a) => `- ${a.name} <${a.email}>${a.company ? ` (${a.company})` : ""}`).join("\n") || "(none listed)"}

Notes from the meeting (may be brief or informal):
${input.notes?.trim() || "(no notes were provided - infer a reasonable, generic but plausible summary based on the meeting title, description and attendees, and clearly note that details are approximate since no notes were captured)"}

Write in a tone that is ${toneGuidance(input.tone)}. The user's name is ${input.userName}. Sign the follow-up email using exactly this signature block:
${input.emailSignature || `Best,\n${input.userName}`}

Respond with ONLY valid JSON matching this exact shape, no markdown fences, no commentary:
{
  "summary": string,
  "decisions": string[],
  "actionItems": [{ "description": string, "owner": string, "dueDate": string | null }],
  "followUpEmail": { "subject": string, "body": string }
}

The followUpEmail.body must end with the signature block provided above. dueDate should be an ISO date string a few days out if a reasonable deadline applies, or null if not.`;
}
