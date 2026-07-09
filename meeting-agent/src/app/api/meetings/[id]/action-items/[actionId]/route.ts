import { NextResponse } from "next/server";

import { getOwnedMeeting } from "@/lib/meetingAccess";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; actionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const meeting = await getOwnedMeeting(params.id, session.user.id);
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const actionItem = await prisma.actionItem.findFirst({
    where: { id: params.actionId, meetingSummary: { meetingId: meeting.id } },
  });
  if (!actionItem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: { owner?: string; dueDate?: Date | null; completed?: boolean; description?: string } = {};

  if (typeof body.owner === "string") data.owner = body.owner;
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.completed === "boolean") data.completed = body.completed;
  if (body.dueDate === null) data.dueDate = null;
  else if (typeof body.dueDate === "string") data.dueDate = new Date(body.dueDate);

  const updated = await prisma.actionItem.update({ where: { id: actionItem.id }, data });

  return NextResponse.json({ actionItem: updated });
}
