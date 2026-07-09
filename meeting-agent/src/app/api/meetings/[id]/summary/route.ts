import { NextResponse } from "next/server";

import { runSummaryGeneration } from "@/lib/jobs/generateSummary";
import { jobQueue } from "@/lib/jobs/queue";
import { getOwnedMeeting } from "@/lib/meetingAccess";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const meeting = await getOwnedMeeting(params.id, session.user.id);
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const summary = await prisma.meetingSummary.findUnique({
    where: { meetingId: meeting.id },
    include: { actionItems: { orderBy: { createdAt: "asc" } } },
  });
  const draft = await prisma.emailDraft.findFirst({
    where: { meetingId: meeting.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ summary, draft });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const meeting = await getOwnedMeeting(params.id, session.user.id);
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let notes: string | undefined;
  try {
    const body = await req.json();
    notes = typeof body?.notes === "string" ? body.notes : undefined;
  } catch {
    // no body provided, that's fine
  }

  await prisma.meetingSummary.upsert({
    where: { meetingId: meeting.id },
    update: { status: "GENERATING", error: null },
    create: { meetingId: meeting.id, status: "GENERATING" },
  });

  jobQueue.enqueue(() => runSummaryGeneration(meeting.id, notes));

  return NextResponse.json({ status: "GENERATING" }, { status: 202 });
}
