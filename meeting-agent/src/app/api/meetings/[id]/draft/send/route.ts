import { NextResponse } from "next/server";

import { getOwnedMeeting } from "@/lib/meetingAccess";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Attendee } from "@/types";

// Google OAuth is scoped to calendar.readonly + gmail.readonly only (no
// gmail.send), so this app never sends email via the Gmail API on the
// user's behalf. Instead, this route just records the draft as sent for
// meeting-history purposes; the actual send happens through a `mailto:`
// link the client opens in the user's own mail client (see
// DraftEmailEditor.tsx).
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

  const updated = await prisma.emailDraft.update({
    where: { id: draft.id },
    data: { status: "SENT", sentAt: new Date() },
  });

  return NextResponse.json({ draft: updated, recipients });
}
