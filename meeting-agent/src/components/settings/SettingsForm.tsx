"use client";

import { useState } from "react";

import { Button, Card, Spinner } from "@/components/ui";

const TONE_OPTIONS = [
  { value: "FORMAL", label: "Formal", description: "Precise and businesslike." },
  { value: "FRIENDLY", label: "Friendly", description: "Warm and conversational." },
  { value: "CONCISE", label: "Concise", description: "Short, plain, no filler." },
  { value: "CONSULTATIVE", label: "Consultative", description: "Confident, advisory tone." },
] as const;

export function SettingsForm({
  initialTone,
  initialSignature,
}: {
  initialTone: string;
  initialSignature: string;
}) {
  const [tone, setTone] = useState(initialTone);
  const [signature, setSignature] = useState(initialSignature);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiTone: tone, emailSignature: signature }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-sm font-semibold text-slate-900">AI tone</h2>
        <p className="mt-1 text-sm text-slate-500">
          Controls the tone used when generating prep briefs and follow-up emails.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TONE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col rounded-lg border p-3 text-sm transition-colors ${
                tone === option.value
                  ? "border-brand-400 bg-brand-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-slate-900">
                <input
                  type="radio"
                  name="tone"
                  value={option.value}
                  checked={tone === option.value}
                  onChange={() => setTone(option.value)}
                  className="h-4 w-4 text-brand-500 focus:ring-brand-400"
                />
                {option.label}
              </span>
              <span className="mt-1 pl-6 text-xs text-slate-500">{option.description}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Email signature</h2>
        <p className="mt-1 text-sm text-slate-500">
          Appended to every generated follow-up email draft.
        </p>
        <textarea
          className="mt-3 h-32 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder={"Best,\nYour Name"}
        />
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Spinner className="h-4 w-4" />}
          Save changes
        </Button>
        {saved && <span className="text-sm text-emerald-600">Saved</span>}
      </div>
    </div>
  );
}
