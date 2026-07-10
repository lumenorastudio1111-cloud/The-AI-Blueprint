import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const settingsSchema = z.object({
  aiTone: z.enum(["FORMAL", "FRIENDLY", "CONCISE", "CONSULTATIVE"]),
  emailSignature: z.string().max(2000),
});

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const parsed = settingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  });

  return NextResponse.json({
    aiTone: user.aiTone,
    emailSignature: user.emailSignature,
  });
}
