import { redirect } from "next/navigation";

import { Nav } from "@/components/Nav";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Customize how the AI writes prep briefs and follow-up emails on your behalf.
        </p>
        <div className="mt-6">
          <SettingsForm initialTone={user.aiTone} initialSignature={user.emailSignature} />
        </div>
      </main>
    </div>
  );
}
