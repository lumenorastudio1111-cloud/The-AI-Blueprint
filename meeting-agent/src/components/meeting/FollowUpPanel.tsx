"use client";

import { useEffect, useRef, useState } from "react";

import { ActionItemsList, type ActionItem } from "@/components/meeting/ActionItemsList";
import { DraftEmailEditor, type Draft } from "@/components/meeting/DraftEmailEditor";
import { Button, Card, EmptyState, Spinner } from "@/components/ui";
import { formatRelative } from "@/lib/format";

type Summary = {
  status: "NOT_STARTED" | "GENERATING" | "READY" | "ERROR";
  error?: string | null;
  summary?: string | null;
  decisions?: string[] | null;
  generatedAt?: string | null;
  actionItems?: ActionItem[];
} | null;

export function FollowUpPanel({
  meetingId,
  initialSummary,
  initialDraft,
}: {
  meetingId: string;
  initialSummary: Summary;
  initialDraft: Draft;
}) {
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [notes, setNotes] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function refresh() {
    const res = await fetch(`/api/meetings/${meetingId}/summary`);
    if (!res.ok) return;
    const data = await res.json();
    setSummary(data.summary);
    setDraft(data.draft);
    return data.summary?.status;
  }

  useEffect(() => {
    if (summary?.status === "GENERATING" && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const status = await refresh();
        if (status !== "GENERATING" && pollRef.current) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.status]);

  async function generate() {
    setSummary({ status: "GENERATING" });
    await fetch(`/api/meetings/${meetingId}/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    await refresh();
  }

  if (!summary || summary.status === "NOT_STARTED") {
    return (
      <EmptyState
        title="No follow-up pack yet"
        description="Optionally paste your raw meeting notes below, then generate a summary, action items, and a draft follow-up email."
        action={
          <div className="w-full max-w-md space-y-3 text-left">
            <textarea
              className="h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              placeholder="Paste meeting notes here (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button className="w-full" onClick={generate}>
              Generate follow-up pack
            </Button>
          </div>
        }
      />
    );
  }

  if (summary.status === "GENERATING") {
    return (
      <Card className="flex items-center gap-3 py-10 text-slate-600">
        <Spinner className="h-5 w-5 text-brand-500" />
        Generating your follow-up pack...
      </Card>
    );
  }

  if (summary.status === "ERROR") {
    return (
      <EmptyState
        title="Something went wrong"
        description={summary.error || "Failed to generate the follow-up pack."}
        action={<Button onClick={generate}>Try again</Button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {summary.generatedAt ? `Generated ${formatRelative(new Date(summary.generatedAt))}` : null}
        </p>
        <Button variant="secondary" size="sm" onClick={generate}>
          Regenerate
        </Button>
      </div>

      {summary.summary && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-900">Summary</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{summary.summary}</p>
        </Card>
      )}

      {summary.decisions && summary.decisions.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-900">Decisions made</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-slate-600">
            {summary.decisions.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </Card>
      )}

      {summary.actionItems && <ActionItemsList meetingId={meetingId} initialItems={summary.actionItems} />}

      <DraftEmailEditor meetingId={meetingId} initialDraft={draft} />
    </div>
  );
}
