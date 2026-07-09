import { prisma } from "@/lib/prisma";

export async function getOwnedMeeting(meetingId: string, userId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, userId },
  });
  return meeting;
}
