"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Spinner } from "@/components/ui";

export function SyncButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleSync() {
    setState("loading");
    try {
      const res = await fetch("/api/meetings/sync", { method: "POST" });
      if (!res.ok) throw new Error("sync failed");
      setState("idle");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={handleSync} disabled={state === "loading"}>
        {state === "loading" && <Spinner className="h-3.5 w-3.5" />}
        Sync calendar
      </Button>
      {state === "error" && <span className="text-xs text-red-600">Sync failed. Try again.</span>}
    </div>
  );
}
