import { generateFollowUp } from "@/lib/ai/client";
import { prisma } from "@/lib/prisma";
import type { Attendee } from "@/types";

export async function runSummaryGeneration(meetingId: string, notes?: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { user: true },
  });
  if (!meeting) return;

  try {
    const attendees = (meeting.attendees as unknown as Attendee[]) ?? [];

    const result = await generateFollowUp({
      meetingTitle: meeting.title,
      meetingDescription: meeting.description,
      attendees,
      tone: meeting.user.aiTone,
      emailSignature: meeting.user.emailSignature,
      userName: meeting.user.name || "there",
      notes,
    });

    const summary = await prisma.meetingSummary.upsert({
      where: { meetingId },
      update: {
        status: "READY",
        error: null,
        summary: result.summary,
        decisions: result.decisions,
        generatedAt: new Date(),
      },
      create: {
        meetingId,
        status: "READY",
        summary: result.summary,
        decisions: result.decisions,
        generatedAt: new Date(),
      },
    });

    await prisma.actionItem.deleteMany({ where: { meetingSummaryId: summary.id } });
    await prisma.actionItem.createMany({
      data: result.actionItems.map((item) => ({
        meetingSummaryId: summary.id,
        description: item.description,
        owner: item.owner,
        dueDate: item.dueDate ? new Date(item.dueDate) : null,
      })),
    });

    const existingDraft = await prisma.emailDraft.findFirst({
      where: { meetingId, status: "DRAFT" },
      orderBy: { createdAt: "desc" },
    });

    if (existingDraft) {
      await prisma.emailDraft.update({
        where: { id: existingDraft.id },
        data: { subject: result.followUpEmail.subject, body: result.followUpEmail.body },
      });
    } else {
      await prisma.emailDraft.create({
        data: {
          meetingId,
          subject: result.followUpEmail.subject,
          body: result.followUpEmail.body,
        },
      });
    }
  } catch (error) {
    console.error(`[jobs] summary generation failed for meeting ${meetingId}`, error);
    await prisma.meetingSummary.upsert({
      where: { meetingId },
      update: { status: "ERROR", error: "Failed to generate follow-up. Please try again." },
      create: {
        meetingId,
        status: "ERROR",
        error: "Failed to generate follow-up. Please try again.",
      },
    });
  }
}
