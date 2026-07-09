import { redirect } from "next/navigation";

import { Nav } from "@/components/Nav";
import { Badge, Button, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    description: "Get started with the basics.",
    features: ["Up to 5 prep briefs / month", "Up to 5 follow-up packs / month", "1 connected Google account"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$29/mo",
    description: "For consultants and AEs with frequent client meetings.",
    features: ["Unlimited prep briefs", "Unlimited follow-up packs", "Priority email drafting", "Meeting history export"],
  },
  {
    id: "TEAM",
    name: "Team",
    price: "$79/mo",
    description: "For agencies and CS teams sharing account context.",
    features: ["Everything in Pro", "Shared meeting history", "Team-wide tone & signature presets", "Admin controls"],
  },
];

export default async function BillingPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const currentPlan = user?.plan ?? "FREE";

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          This is a placeholder billing page. Payments aren&apos;t wired up yet - upgrade buttons are
          disabled until a billing provider (e.g. Stripe) is connected.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <Card key={plan.id} className={isCurrent ? "border-brand-400 ring-1 ring-brand-400" : ""}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
                  {isCurrent && <Badge tone="brand">Current plan</Badge>}
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">{plan.price}</p>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5 w-full"
                  variant={isCurrent ? "secondary" : "primary"}
                  disabled
                  title="Billing isn't connected yet"
                >
                  {isCurrent ? "Current plan" : "Coming soon"}
                </Button>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
