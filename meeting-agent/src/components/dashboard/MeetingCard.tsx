import Link from "next/link";

import { Badge, Card } from "@/components/ui";
import { formatMeetingTime } from "@/lib/format";
import type { Attendee } from "@/types";

type MeetingCardProps = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  attendees: Attendee[];
  kind: "upcoming" | "completed";
  briefStatus?: string;
  summaryStatus?: string;
};

export function MeetingCard({
  id,
  title,
  startTime,
  endTime,
  attendees,
  kind,
  briefStatus,
  summaryStatus,
}: MeetingCardProps) {
  return (
    <Link href={`/meetings/${id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">{formatMeetingTime(startTime, endTime)}</p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">{title}</h3>
          </div>
          {kind === "upcoming" ? (
            <Badge tone={briefStatus === "READY" ? "green" : "amber"}>
              {briefStatus === "READY" ? "Brief ready" : "Needs prep"}
            </Badge>
          ) : (
            <Badge tone={summaryStatus === "READY" ? "green" : "amber"}>
              {summaryStatus === "READY" ? "Follow-up ready" : "Needs follow-up"}
            </Badge>
          )}
        </div>

        {attendees.length > 0 && (
          <p className="mt-3 truncate text-sm text-slate-500">
            {attendees.map((a) => a.name).join(", ")}
          </p>
        )}
      </Card>
    </Link>
  );
}
