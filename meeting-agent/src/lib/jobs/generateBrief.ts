import { generateMeetingBrief } from "@/lib/ai/client";
import { getGoogleClientForUser } from "@/lib/google/client";
import { fetchRecentEmailContext } from "@/lib/google/gmail";
import { prisma } from "@/lib/prisma";
import type { Attendee } from "@/types";

export async function runBriefGeneration(meetingId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { user: true },
  });
  if (!meeting) return;

  try {
    const attendees = (meeting.attendees as unknown as Attendee[]) ?? [];
    const attendeeEmails = attendees.map((a) => a.email).filter(Boolean);

    const client = await getGoogleClientForUser(meeting.userId);
    const recentEmails = client
      ? await fetchRecentEmailContext(client, attendeeEmails)
      : [];

    const priorMeetings = await prisma.meeting.findMany({
      where: {
        userId: meeting.userId,
        status: "COMPLETED",
        id: { not: meeting.id },
      },
      include: { summary: true },
      orderBy: { startTime: "desc" },
      take: 10,
    });

    const priorMeetingSummaries = priorMeetings
      .filter((m) => {
        const mAttendees = (m.attendees as unknown as Attendee[]) ?? [];
        return mAttendees.some((a) => attendeeEmails.includes(a.email));
      })
      .map((m) => m.summary?.summary)
      .filter((s): s is string => Boolean(s))
      .slice(0, 3);

    const result = await generateMeetingBrief({
      meetingTitle: meeting.title,
      meetingDescription: meeting.description,
      startTime: meeting.startTime.toISOString(),
      attendees,
      recentEmails,
      priorMeetingSummaries,
      tone: meeting.user.aiTone,
      userName: meeting.user.name || "there",
    });

    await prisma.meetingBrief.upsert({
      where: { meetingId },
      update: {
        status: "READY",
        error: null,
        attendeeContext: result.attendeeContext,
        companyContext: result.companyContext,
        recentEmailContext: result.recentEmailContext,
        priorMeetingContext: result.priorMeetingContext,
        likelyGoals: result.likelyGoals,
        suggestedQuestions: result.suggestedQuestions,
        risks: result.risks,
        generatedAt: new Date(),
      },
      create: {
        meetingId,
        status: "READY",
        attendeeContext: result.attendeeContext,
        companyContext: result.companyContext,
        recentEmailContext: result.recentEmailContext,
        priorMeetingContext: result.priorMeetingContext,
        likelyGoals: result.likelyGoals,
        suggestedQuestions: result.suggestedQuestions,
        risks: result.risks,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`[jobs] brief generation failed for meeting ${meetingId}`, error);
    await prisma.meetingBrief.upsert({
      where: { meetingId },
      update: { status: "ERROR", error: "Failed to generate brief. Please try again." },
      create: {
        meetingId,
        status: "ERROR",
        error: "Failed to generate brief. Please try again.",
      },
    });
  }
}
