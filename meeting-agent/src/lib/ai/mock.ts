import type {
  BriefGenerationInput,
  BriefGenerationResult,
  SummaryGenerationInput,
  SummaryGenerationResult,
} from "@/types";

/**
 * Deterministic, template-based stand-in for the AI provider. Used when no
 * ANTHROPIC_API_KEY is configured, so the whole product can be exercised
 * locally with zero external dependencies.
 */
export function generateMockBrief(input: BriefGenerationInput): BriefGenerationResult {
  const primary = input.attendees[0];
  const company = primary?.company || "their company";

  return {
    attendeeContext: input.attendees.map((a) => ({
      name: a.name,
      email: a.email,
      company: a.company,
      title: undefined,
      notes: a.company
        ? `Works at ${a.company}. No additional profile data available yet - connect Gmail for richer context.`
        : "No additional profile data available yet.",
    })),
    companyContext: primary?.company
      ? `${primary.company} is one of the attendee organizations for this meeting. Add Gmail context or CRM notes for a fuller picture.`
      : "No company context available for this meeting yet.",
    recentEmailContext: input.recentEmails.slice(0, 5),
    priorMeetingContext:
      input.priorMeetingSummaries[0] ||
      "No prior meetings found with these attendees. This looks like a first conversation.",
    likelyGoals: [
      `Understand what ${primary?.name ?? "the attendee"} most wants out of "${input.meetingTitle}"`,
      "Confirm timeline and next steps before the meeting ends",
      `Identify how this connects to ${company}'s broader priorities`,
    ],
    suggestedQuestions: [
      "What does success look like for you coming out of this conversation?",
      "What's changed since we last spoke that I should know about?",
      "Who else should be involved in moving this forward?",
    ],
    risks: [
      "No recent email context was found for this meeting - confirm attendee expectations early in the call.",
      "Double-check meeting time and attendee list against the calendar invite in case of last-minute changes.",
    ],
  };
}

export function generateMockSummary(input: SummaryGenerationInput): SummaryGenerationResult {
  const primary = input.attendees[0];
  const signature = input.emailSignature || `Best,\n${input.userName}`;
  const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const summary = input.notes?.trim()
    ? `Summary based on your notes: ${input.notes.trim()}`
    : `"${input.meetingTitle}" took place with ${
        input.attendees.map((a) => a.name).join(", ") || "attendees"
      }. No detailed notes were captured, so this is a placeholder summary - add notes and regenerate for a more accurate recap.`;

  return {
    summary,
    decisions: input.notes?.trim()
      ? ["Review the notes above and confirm key decisions before sending the follow-up."]
      : ["No decisions captured - add meeting notes for a more useful summary."],
    actionItems: [
      {
        description: `Send follow-up notes and next steps to ${primary?.name ?? "the attendee"}`,
        owner: input.userName,
        dueDate,
      },
      {
        description: "Confirm next meeting or check-in date",
        owner: primary?.name,
        dueDate: null,
      },
    ],
    followUpEmail: {
      subject: `Following up on ${input.meetingTitle}`,
      body: `Hi ${primary?.name ?? "there"},

Thanks for the time today - great talking through "${input.meetingTitle}".

I'll follow up with more detail shortly. In the meantime, let me know if anything below doesn't match your understanding, or if there's anything I should add.

${signature}`,
    },
  };
}
