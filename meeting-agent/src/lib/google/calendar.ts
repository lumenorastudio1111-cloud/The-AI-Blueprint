import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

import type { Attendee } from "@/types";

export type FetchedCalendarEvent = {
  googleEventId: string;
  title: string;
  description: string | null;
  location: string | null;
  meetingLink: string | null;
  startTime: Date;
  endTime: Date;
  attendees: Attendee[];
  organizerEmail: string | null;
};

/**
 * Fetches upcoming events (next `daysAhead` days) plus recently completed
 * events (past `daysBehind` days, so follow-up packs can be generated) from
 * the user's primary Google Calendar.
 */
export async function fetchCalendarEvents(
  client: OAuth2Client,
  { daysAhead = 14, daysBehind = 7 }: { daysAhead?: number; daysBehind?: number } = {}
): Promise<FetchedCalendarEvent[]> {
  const calendar = google.calendar({ version: "v3", auth: client });

  const timeMin = new Date(Date.now() - daysBehind * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  const events = res.data.items ?? [];

  return events
    .filter((event) => event.start?.dateTime && event.status !== "cancelled")
    .map((event) => {
      const attendees: Attendee[] = (event.attendees ?? [])
        .filter((a) => !a.self)
        .map((a) => ({
          name: a.displayName || a.email?.split("@")[0] || "Unknown",
          email: a.email ?? "",
          company: a.email ? guessCompanyFromEmail(a.email) : undefined,
          responseStatus: (a.responseStatus as Attendee["responseStatus"]) ?? "needsAction",
        }));

      return {
        googleEventId: event.id ?? "",
        title: event.summary ?? "(No title)",
        description: event.description ?? null,
        location: event.location ?? null,
        meetingLink: event.hangoutLink ?? extractMeetingLink(event.description ?? ""),
        startTime: new Date(event.start!.dateTime!),
        endTime: new Date(event.end?.dateTime ?? event.start!.dateTime!),
        attendees,
        organizerEmail: event.organizer?.email ?? null,
      };
    });
}

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
]);

function guessCompanyFromEmail(email: string): string | undefined {
  const domain = email.split("@")[1];
  if (!domain || FREE_EMAIL_DOMAINS.has(domain)) return undefined;
  const name = domain.split(".")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function extractMeetingLink(text: string): string | null {
  const match = text.match(/https?:\/\/(meet|zoom|teams)\S+/i);
  return match ? match[0] : null;
}
