import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function getSession() {
  return getServerSession(authOptions);
}
