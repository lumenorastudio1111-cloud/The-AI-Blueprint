"use client";

import { useState } from "react";
import clsx from "clsx";

import type { Draft } from "@/components/meeting/DraftEmailEditor";
import type { ActionItem } from "@/components/meeting/ActionItemsList";
import { BriefPanel } from "@/components/meeting/BriefPanel";
import { FollowUpPanel } from "@/components/meeting/FollowUpPanel";

type BriefData = Parameters<typeof BriefPanel>[0]["initialBrief"];

export function MeetingTabs({
  meetingId,
  defaultTab,
  brief,
  summary,
  draft,
}: {
  meetingId: string;
  defaultTab: "brief" | "followup";
  brief: BriefData;
  summary: {
    status: "NOT_STARTED" | "GENERATING" | "READY" | "ERROR";
    error?: string | null;
    summary?: string | null;
    decisions?: string[] | null;
    generatedAt?: string | null;
    actionItems?: ActionItem[];
  } | null;
  draft: Draft;
}) {
  const [tab, setTab] = useState<"brief" | "followup">(defaultTab);

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setTab("brief")}
          className={clsx(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "brief" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          )}
        >
          Prep brief
        </button>
        <button
          onClick={() => setTab("followup")}
          className={clsx(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "followup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          )}
        >
          Follow-up pack
        </button>
      </div>

      {tab === "brief" ? (
        <BriefPanel meetingId={meetingId} initialBrief={brief} />
      ) : (
        <FollowUpPanel meetingId={meetingId} initialSummary={summary} initialDraft={draft} />
      )}
    </div>
  );
}
