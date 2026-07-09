import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginButtons } from "@/components/LoginButtons";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const demoEnabled = process.env.ENABLE_DEMO_LOGIN === "true";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="text-center">
          <Link href="/" className="text-base font-semibold text-slate-900">
            MeetingPrep<span className="text-brand-500">.ai</span>
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Sign in to your account</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Connect Google Calendar and Gmail to start prepping smarter.
          </p>
        </div>

        <div className="mt-6">
          <LoginButtons googleEnabled={googleEnabled} demoEnabled={demoEnabled} />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          By continuing you agree to let MeetingPrep.ai read your calendar events and email
          metadata to generate meeting briefs and follow-ups.
        </p>
      </div>
    </main>
  );
}
