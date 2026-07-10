"use client";

import { useState } from "react";

import { Button, Card, Spinner } from "@/components/ui";
import { formatRelative } from "@/lib/format";

export type Draft = {
  id: string;
  subject: string;
  body: string;
  status: "DRAFT" | "SENT";
  sentAt?: string | null;
} | null;

export function DraftEmailEditor({
  meetingId,
  initialDraft,
}: {
  meetingId: string;
  initialDraft: Draft;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [subject, setSubject] = useState(initialDraft?.subject ?? "");
  const [body, setBody] = useState(initialDraft?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRecently, setSavedRecently] = useState(false);

  if (!draft) return null;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      setDraft(data.draft);
      setSavedRecently(true);
      setTimeout(() => setSavedRecently(false), 2000);
    } catch {
      setError("Failed to save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function send() {
    setSending(true);
    setError(null);
    try {
      await save();
      const res = await fetch(`/api/meetings/${meetingId}/draft/send`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "send failed");
      }
      const data: { draft: NonNullable<Draft>; recipients: string[] } = await res.json();
      setDraft(data.draft);

      // The app only requests read-only Gmail access, so it can't send on
      // the user's behalf via the API - hand off to their own mail client
      // with everything pre-filled instead.
      const mailto = `mailto:${data.recipients.join(",")}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send email.");
    } finally {
      setSending(false);
    }
  }

  const isSent = draft.status === "SENT";

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Follow-up email</h3>
        {isSent && draft.sentAt && (
          <span className="text-xs text-emerald-600">Sent {formatRelative(new Date(draft.sentAt))}</span>
        )}
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500">Subject</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:bg-slate-50 disabled:text-slate-500"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isSent}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Body</label>
          <textarea
            className="mt-1 h-56 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:bg-slate-50 disabled:text-slate-500"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isSent}
          />
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {!isSent && (
        <>
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={send} disabled={sending || saving}>
              {sending && <Spinner className="h-4 w-4" />}
              Send via email client
            </Button>
            <Button variant="secondary" onClick={save} disabled={sending || saving}>
              {saving && <Spinner className="h-4 w-4" />}
              Save draft
            </Button>
            {savedRecently && <span className="text-xs text-slate-400">Saved</span>}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Opens this email in your default mail app, addressed and ready to send.
          </p>
        </>
      )}
    </Card>
  );
}
