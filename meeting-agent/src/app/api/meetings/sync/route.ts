import { NextResponse } from "next/server";

import { getGoogleClientForUser } from "@/lib/google/client";
import { fetchCalendarEvents } from "@/lib/google/calendar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const userId = session.user.id;
  const client = await getGoogleClientForUser(userId);

  if (!client) {
    return NextResponse.json(
      { error: "No connected Google Calendar account. Connect Google Calendar first." },
      { status: 400 }
    );
  }

  try {
    const events = await fetchCalendarEvents(client);

    for (const event of events) {
      const status = event.endTime.getTime() < Date.now() ? "COMPLETED" : "UPCOMING";

      await prisma.meeting.upsert({
        where: { userId_googleEventId: { userId, googleEventId: event.googleEventId } },
        update: {
          title: event.title,
          description: event.description,
          location: event.location,
          meetingLink: event.meetingLink,
          startTime: event.startTime,
          endTime: event.endTime,
          attendees: event.attendees,
          organizerEmail: event.organizerEmail,
          status,
        },
        create: {
          userId,
          googleEventId: event.googleEventId,
          title: event.title,
          description: event.description,
          location: event.location,
          meetingLink: event.meetingLink,
          startTime: event.startTime,
          endTime: event.endTime,
          attendees: event.attendees,
          organizerEmail: event.organizerEmail,
          status,
        },
      });
    }

    await prisma.connectedAccount.updateMany({
      where: { userId, provider: "GOOGLE_CALENDAR" },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({ synced: events.length });
  } catch (error) {
    console.error("[meetings/sync] failed", error);
    return NextResponse.json({ error: "Failed to sync calendar" }, { status: 500 });
  }
}
