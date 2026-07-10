import { redirect } from "next/navigation";

import { ConnectionBadges } from "@/components/dashboard/ConnectionBadges";
import { MeetingCard } from "@/components/dashboard/MeetingCard";
import { SyncButton } from "@/components/dashboard/SyncButton";
import { Nav } from "@/components/Nav";
import { EmptyState, SectionHeading } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Attendee } from "@/types";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [connectedAccounts, upcomingMeetings, completedMeetings] = await Promise.all([
    prisma.connectedAccount.findMany({ where: { userId } }),
    prisma.meeting.findMany({
      where: { userId, status: "UPCOMING" },
      include: { brief: true },
      orderBy: { startTime: "asc" },
      take: 10,
    }),
    prisma.meeting.findMany({
      where: { userId, status: "COMPLETED" },
      include: { summary: true },
      orderBy: { startTime: "desc" },
      take: 10,
    }),
  ]);

  const calendarConnected = connectedAccounts.some(
    (a) => a.provider === "GOOGLE_CALENDAR" && a.status === "CONNECTED"
  );
  const gmailConnected = connectedAccounts.some(
    (a) => a.provider === "GMAIL" && a.status === "CONNECTED"
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your meetings</h1>
            <div className="mt-2">
              <ConnectionBadges calendarConnected={calendarConnected} gmailConnected={gmailConnected} />
            </div>
          </div>
          <SyncButton />
        </div>

        {!calendarConnected && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Connect Google Calendar to pull in your upcoming meetings automatically.
          </div>
        )}

        <section className="mt-8">
          <SectionHeading
            title="Upcoming meetings"
            description="Generate a prep brief before you walk in."
          />
          {upcomingMeetings.length === 0 ? (
            <EmptyState
              title="No upcoming meetings yet"
              description={
                calendarConnected
                  ? "Sync your calendar to pull in upcoming meetings, or check back once something's on the books."
                  : "Connect Google Calendar to see your upcoming meetings here."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  id={meeting.id}
                  title={meeting.title}
                  startTime={meeting.startTime}
                  endTime={meeting.endTime}
                  attendees={(meeting.attendees as unknown as Attendee[]) ?? []}
                  kind="upcoming"
                  briefStatus={meeting.brief?.status}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <SectionHeading
            title="Recent meetings"
            description="Turn what just happened into a follow-up pack."
          />
          {completedMeetings.length === 0 ? (
            <EmptyState
              title="No completed meetings yet"
              description="Once a meeting wraps up, it'll show up here so you can generate a follow-up pack."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  id={meeting.id}
                  title={meeting.title}
                  startTime={meeting.startTime}
                  endTime={meeting.endTime}
                  attendees={(meeting.attendees as unknown as Attendee[]) ?? []}
                  kind="completed"
                  summaryStatus={meeting.summary?.status}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
