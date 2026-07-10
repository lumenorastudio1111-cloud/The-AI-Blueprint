"use client";

import { useEffect, useRef, useState } from "react";

import { Button, Card, EmptyState, Spinner } from "@/components/ui";
import { formatRelative } from "@/lib/format";
import type { AttendeeContext, EmailContextItem } from "@/types";

type Brief = {
  status: "NOT_STARTED" | "GENERATING" | "READY" | "ERROR";
  error?: string | null;
  attendeeContext?: AttendeeContext[] | null;
  companyContext?: string | null;
  recentEmailContext?: EmailContextItem[] | null;
  priorMeetingContext?: string | null;
  likelyGoals?: string[] | null;
  suggestedQuestions?: string[] | null;
  risks?: string[] | null;
  generatedAt?: string | null;
} | null;

export function BriefPanel({ meetingId, initialBrief }: { meetingId: string; initialBrief: Brief }) {
  const [brief, setBrief] = useState<Brief>(initialBrief);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (brief?.status === "GENERATING" && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const res = await fetch(`/api/meetings/${meetingId}/brief`);
        if (!res.ok) return;
        const data = await res.json();
        setBrief(data.brief);
        if (data.brief?.status !== "GENERATING" && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 2000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [brief?.status, meetingId]);

  async function generate() {
    setBrief({ status: "GENERATING" });
    await fetch(`/api/meetings/${meetingId}/brief`, { method: "POST" });
    const res = await fetch(`/api/meetings/${meetingId}/brief`);
    const data = await res.json();
    setBrief(data.brief);
  }

  if (!brief || brief.status === "NOT_STARTED") {
    return (
      <EmptyState
        title="No prep brief yet"
        description="Generate a brief covering attendee context, recent emails, likely goals, and suggested questions."
        action={<Button onClick={generate}>Generate prep brief</Button>}
      />
    );
  }

  if (brief.status === "GENERATING") {
    return (
      <Card className="flex items-center gap-3 py-10 text-slate-600">
        <Spinner className="h-5 w-5 text-brand-500" />
        Generating your prep brief...
      </Card>
    );
  }

  if (brief.status === "ERROR") {
    return (
      <EmptyState
        title="Something went wrong"
        description={brief.error || "Failed to generate the prep brief."}
        action={<Button onClick={generate}>Try again</Button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {brief.generatedAt ? `Generated ${formatRelative(new Date(brief.generatedAt))}` : null}
        </p>
        <Button variant="secondary" size="sm" onClick={generate}>
          Regenerate
        </Button>
      </div>

      {brief.attendeeContext && brief.attendeeContext.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-900">Attendees</h3>
          <div className="mt-3 space-y-3">
            {brief.attendeeContext.map((a) => (
              <div key={a.email}>
                <p className="text-sm font-medium text-slate-800">
                  {a.name} {a.company && <span className="font-normal text-slate-500">· {a.company}</span>}
                  {a.title && <span className="font-normal text-slate-400"> · {a.title}</span>}
                </p>
                {a.notes && <p className="mt-0.5 text-sm text-slate-500">{a.notes}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {brief.companyContext && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-900">Company context</h3>
          <p className="mt-2 text-sm text-slate-600">{brief.companyContext}</p>
        </Card>
      )}

      {brief.recentEmailContext && brief.recentEmailContext.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-900">Recent email context</h3>
          <div className="mt-3 space-y-3">
            {brief.recentEmailContext.map((e, i) => (
              <div key={i} className="border-l-2 border-slate-200 pl-3">
                <p className="text-sm font-medium text-slate-700">{e.subject}</p>
                <p className="text-xs text-slate-400">{e.from}</p>
                <p className="mt-1 text-sm text-slate-500">{e.snippet}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {brief.priorMeetingContext && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-900">Prior meeting context</h3>
          <p className="mt-2 text-sm text-slate-600">{brief.priorMeetingContext}</p>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {brief.likelyGoals && brief.likelyGoals.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900">Likely goals</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-slate-600">
              {brief.likelyGoals.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </Card>
        )}

        {brief.suggestedQuestions && brief.suggestedQuestions.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900">Suggested questions</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-slate-600">
              {brief.suggestedQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {brief.risks && brief.risks.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <h3 className="text-sm font-semibold text-amber-900">Risks &amp; talking points</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-amber-800">
            {brief.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
