import Link from "next/link";

import { Badge } from "@/components/ui";

export function ConnectionBadges({
  calendarConnected,
  gmailConnected,
}: {
  calendarConnected: boolean;
  gmailConnected: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ConnectionPill label="Google Calendar" connected={calendarConnected} />
      <ConnectionPill label="Gmail" connected={gmailConnected} />
    </div>
  );
}

function ConnectionPill({ label, connected }: { label: string; connected: boolean }) {
  if (connected) {
    return (
      <Badge tone="green">
        {label} connected
      </Badge>
    );
  }
  return (
    <Link
      href="/api/auth/signin/google?callbackUrl=%2Fdashboard"
      className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-200"
    >
      Connect {label}
    </Link>
  );
}
