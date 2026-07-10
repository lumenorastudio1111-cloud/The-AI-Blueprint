import Link from "next/link";

import { LinkButton } from "@/components/ui";

const features = [
  {
    title: "Prep briefs, automatically",
    description:
      "Before every meeting, get attendee background, recent email context, prior meeting history, likely goals, and suggested questions - without digging through your inbox.",
  },
  {
    title: "Follow-ups that write themselves",
    description:
      "After the meeting, get a clear summary, decisions made, action items with owners and due dates, and a ready-to-edit follow-up email.",
  },
  {
    title: "Built on Calendar + Gmail",
    description:
      "Connects to the tools you already use. No new inbox, no new calendar - just a smarter layer on top of the meetings you already have.",
  },
];

const steps = [
  { title: "Connect", description: "Sign in with Google to link your Calendar and Gmail." },
  { title: "Prep", description: "Open any upcoming meeting and generate a prep brief in seconds." },
  { title: "Follow up", description: "After the call, get a summary, action items, and a draft email ready to send." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-base font-semibold text-slate-900">
          MeetingPrep<span className="text-brand-500">.ai</span>
        </span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Sign in
          </Link>
          <LinkButton href="/login" size="sm">
            Get started free
          </LinkButton>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-20 pt-12 text-center sm:pt-20">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          For consultants, founders, and client-facing teams
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Walk into every meeting prepared.
          <br className="hidden sm:block" /> Leave with clear next steps.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          MeetingPrep.ai connects to your Google Calendar and Gmail to generate a prep brief before
          every meeting and a follow-up pack after - so meeting admin stops eating your evenings.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <LinkButton href="/login" size="md">
            Get started free
          </LinkButton>
          <LinkButton href="#how-it-works" variant="secondary" size="md">
            See how it works
          </LinkButton>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl bg-white p-6 shadow-card">
              <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                {i + 1}
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-500 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Stop doing meeting admin by hand.
          </h2>
          <p className="mt-3 text-brand-50">
            Free to start. Connect your calendar and try it on your next meeting.
          </p>
          <div className="mt-6">
            <LinkButton href="/login" variant="secondary" size="md">
              Get started free
            </LinkButton>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} MeetingPrep.ai. Built for consultants, founders, and
        client-facing teams.
      </footer>
    </main>
  );
}
