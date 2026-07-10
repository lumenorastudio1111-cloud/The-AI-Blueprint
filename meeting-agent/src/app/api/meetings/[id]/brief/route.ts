import { NextResponse } from "next/server";

import { runBriefGeneration } from "@/lib/jobs/generateBrief";
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

  const brief = await prisma.meetingBrief.findUnique({ where: { meetingId: meeting.id } });
  return NextResponse.json({ brief });
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const meeting = await getOwnedMeeting(params.id, session.user.id);
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.meetingBrief.upsert({
    where: { meetingId: meeting.id },
    update: { status: "GENERATING", error: null },
    create: { meetingId: meeting.id, status: "GENERATING" },
  });

  jobQueue.enqueue(() => runBriefGeneration(meeting.id));

  return NextResponse.json({ status: "GENERATING" }, { status: 202 });
}
