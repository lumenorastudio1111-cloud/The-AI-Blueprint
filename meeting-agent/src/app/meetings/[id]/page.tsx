import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MeetingTabs } from "@/components/meeting/MeetingTabs";
import { Nav } from "@/components/Nav";
import { Badge, Card } from "@/components/ui";
import { formatMeetingTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Attendee } from "@/types";

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const meeting = await prisma.meeting.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      brief: true,
      summary: { include: { actionItems: { orderBy: { createdAt: "asc" } } } },
      drafts: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!meeting) notFound();

  const attendees = (meeting.attendees as unknown as Attendee[]) ?? [];
  const draft = meeting.drafts[0]
    ? {
        id: meeting.drafts[0].id,
        subject: meeting.drafts[0].subject,
        body: meeting.drafts[0].body,
        status: meeting.drafts[0].status,
        sentAt: meeting.drafts[0].sentAt?.toISOString() ?? null,
      }
    : null;

  const summary = meeting.summary
    ? {
        status: meeting.summary.status,
        error: meeting.summary.error,
        summary: meeting.summary.summary,
        decisions: (meeting.summary.decisions as unknown as string[]) ?? [],
        generatedAt: meeting.summary.generatedAt?.toISOString() ?? null,
        actionItems: meeting.summary.actionItems.map((item) => ({
          id: item.id,
          description: item.description,
          owner: item.owner,
          dueDate: item.dueDate?.toISOString() ?? null,
          completed: item.completed,
        })),
      }
    : null;

  const brief = meeting.brief
    ? {
        status: meeting.brief.status,
        error: meeting.brief.error,
        attendeeContext: meeting.brief.attendeeContext as never,
        companyContext: meeting.brief.companyContext,
        recentEmailContext: meeting.brief.recentEmailContext as never,
        priorMeetingContext: meeting.brief.priorMeetingContext,
        likelyGoals: meeting.brief.likelyGoals as never,
        suggestedQuestions: meeting.brief.suggestedQuestions as never,
        risks: meeting.brief.risks as never,
        generatedAt: meeting.brief.generatedAt?.toISOString() ?? null,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
          &larr; Back to dashboard
        </Link>

        <Card className="mt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-brand-600">
                {formatMeetingTime(meeting.startTime, meeting.endTime)}
              </p>
              <h1 className="mt-1 text-xl font-bold text-slate-900">{meeting.title}</h1>
            </div>
            <Badge tone={meeting.status === "COMPLETED" ? "slate" : "brand"}>
              {meeting.status === "COMPLETED" ? "Completed" : "Upcoming"}
            </Badge>
          </div>

          {meeting.description && (
            <p className="mt-3 text-sm text-slate-600">{meeting.description}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {meeting.location && <span>📍 {meeting.location}</span>}
            {meeting.meetingLink && (
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 hover:underline"
              >
                Join link
              </a>
            )}
          </div>

          {attendees.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Attendees</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {attendees.map((a) => (
                  <span
                    key={a.email}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                  >
                    {a.name}
                    {a.company ? ` · ${a.company}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="mt-8">
          <MeetingTabs
            meetingId={meeting.id}
            defaultTab={meeting.status === "COMPLETED" ? "followup" : "brief"}
            brief={brief}
            summary={summary}
            draft={draft}
          />
        </div>
      </main>
    </div>
  );
}
