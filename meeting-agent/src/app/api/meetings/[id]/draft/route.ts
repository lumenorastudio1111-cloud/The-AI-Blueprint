import { NextResponse } from "next/server";

import { getOwnedMeeting } from "@/lib/meetingAccess";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const meeting = await getOwnedMeeting(params.id, session.user.id);
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { subject, body: emailBody } = body as { subject?: string; body?: string };

  if (typeof subject !== "string" || typeof emailBody !== "string") {
    return NextResponse.json({ error: "subject and body are required" }, { status: 400 });
  }

  const existing = await prisma.emailDraft.findFirst({
    where: { meetingId: meeting.id },
    orderBy: { createdAt: "desc" },
  });

  const draft = existing
    ? await prisma.emailDraft.update({
        where: { id: existing.id },
        data: { subject, body: emailBody },
      })
    : await prisma.emailDraft.create({
        data: { meetingId: meeting.id, subject, body: emailBody },
      });

  return NextResponse.json({ draft });
}
