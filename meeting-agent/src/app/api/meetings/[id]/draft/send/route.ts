import { NextResponse } from "next/server";

import { getGoogleClientForUser } from "@/lib/google/client";
import { sendGmailMessage } from "@/lib/google/gmail";
import { getOwnedMeeting } from "@/lib/meetingAccess";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Attendee } from "@/types";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const meeting = await getOwnedMeeting(params.id, session.user.id);
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const draft = await prisma.emailDraft.findFirst({
    where: { meetingId: meeting.id },
    orderBy: { createdAt: "desc" },
  });

  if (!draft) {
    return NextResponse.json({ error: "No draft to send" }, { status: 400 });
  }

  const attendees = (meeting.attendees as unknown as Attendee[]) ?? [];
  const recipients = attendees.map((a) => a.email).filter(Boolean);

  if (recipients.length === 0) {
    return NextResponse.json({ error: "Meeting has no attendee email addresses" }, { status: 400 });
  }

  const client = await getGoogleClientForUser(session.user.id);

  try {
    if (client) {
      await sendGmailMessage(client, { to: recipients, subject: draft.subject, body: draft.body });
    } else {
      // No connected Gmail account (e.g. demo login) - simulate the send so
      // the flow can still be exercised end-to-end locally.
      console.log(`[demo] Simulated send to ${recipients.join(", ")}: ${draft.subject}`);
    }

    const updated = await prisma.emailDraft.update({
      where: { id: draft.id },
      data: { status: "SENT", sentAt: new Date() },
    });

    return NextResponse.json({ draft: updated });
  } catch (error) {
    console.error("[draft/send] failed", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
