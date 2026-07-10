import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

import type { EmailContextItem } from "@/types";

/**
 * Pulls recent Gmail messages exchanged with any of the given attendee
 * email addresses, to surface as "recent email context" in a prep brief.
 */
export async function fetchRecentEmailContext(
  client: OAuth2Client,
  attendeeEmails: string[],
  { maxPerAttendee = 3 }: { maxPerAttendee?: number } = {}
): Promise<EmailContextItem[]> {
  if (attendeeEmails.length === 0) return [];

  const gmail = google.gmail({ version: "v1", auth: client });
  const results: EmailContextItem[] = [];

  for (const email of attendeeEmails) {
    try {
      const list = await gmail.users.messages.list({
        userId: "me",
        q: `from:${email} OR to:${email}`,
        maxResults: maxPerAttendee,
      });

      const messages = list.data.messages ?? [];

      for (const message of messages) {
        if (!message.id) continue;
        const full = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });

        const headers = full.data.payload?.headers ?? [];
        const from = headers.find((h) => h.name === "From")?.value ?? email;
        const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
        const date = headers.find((h) => h.name === "Date")?.value;

        results.push({
          from,
          subject,
          snippet: full.data.snippet ?? "",
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`[gmail] failed to fetch context for ${email}`, error);
    }
  }

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
