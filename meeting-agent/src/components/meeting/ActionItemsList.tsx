"use client";

import { useState } from "react";

import { Card } from "@/components/ui";
import { formatDateInput } from "@/lib/format";

export type ActionItem = {
  id: string;
  description: string;
  owner?: string | null;
  dueDate?: string | null;
  completed: boolean;
};

export function ActionItemsList({
  meetingId,
  initialItems,
}: {
  meetingId: string;
  initialItems: ActionItem[];
}) {
  const [items, setItems] = useState(initialItems);

  async function updateItem(id: string, patch: Partial<ActionItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    await fetch(`/api/meetings/${meetingId}/action-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  if (items.length === 0) return null;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900">Action items</h3>
      <div className="mt-3 divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(e) => updateItem(item.id, { completed: e.target.checked })}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-500 focus:ring-brand-400 sm:mt-0"
            />
            <p
              className={`flex-1 text-sm ${
                item.completed ? "text-slate-400 line-through" : "text-slate-700"
              }`}
            >
              {item.description}
            </p>
            <div className="flex items-center gap-2">
              <input
                className="w-32 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-brand-400 focus:outline-none"
                placeholder="Owner"
                value={item.owner ?? ""}
                onChange={(e) => updateItem(item.id, { owner: e.target.value })}
              />
              <input
                type="date"
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-brand-400 focus:outline-none"
                value={formatDateInput(item.dueDate ? new Date(item.dueDate) : null)}
                onChange={(e) =>
                  updateItem(item.id, {
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
