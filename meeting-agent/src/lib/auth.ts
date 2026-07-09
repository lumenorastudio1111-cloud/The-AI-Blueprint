import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");

// Demo login lets reviewers explore the full product without configuring
// Google Cloud OAuth credentials first. It is opt-in via env var and should
// never be enabled in a real production deployment.
const demoLoginEnabled = process.env.ENABLE_DEMO_LOGIN === "true";

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    })
  );
}

if (demoLoginEnabled) {
  providers.push(
    CredentialsProvider({
      id: "demo",
      name: "Demo account",
      credentials: {},
      async authorize() {
        const demoUser = await prisma.user.upsert({
          where: { email: "demo@meetingprep.local" },
          update: {},
          create: {
            email: "demo@meetingprep.local",
            name: "Jordan Rivera",
          },
        });
        return {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          image: demoUser.image,
        };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
      }

      // When a Google account links/re-links, persist which product-level
      // scopes ("connections") were granted so the dashboard can reflect
      // Calendar/Gmail connection status independently.
      if (account?.provider === "google" && token.userId) {
        await syncConnectedAccounts(token.userId as string, account);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },
};

async function syncConnectedAccounts(
  userId: string,
  account: { scope?: string | null; providerAccountId: string }
) {
  const scopes = account.scope?.split(" ") ?? [];
  const hasCalendar = scopes.some((s) => s.includes("calendar"));
  const hasGmail = scopes.some((s) => s.includes("gmail") || s.includes("mail.google.com"));

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  if (hasCalendar) {
    await prisma.connectedAccount.upsert({
      where: { userId_provider: { userId, provider: "GOOGLE_CALENDAR" } },
      update: { status: "CONNECTED", scopes, email: user.email },
      create: {
        userId,
        provider: "GOOGLE_CALENDAR",
        status: "CONNECTED",
        scopes,
        email: user.email,
      },
    });
  }

  if (hasGmail) {
    await prisma.connectedAccount.upsert({
      where: { userId_provider: { userId, provider: "GMAIL" } },
      update: { status: "CONNECTED", scopes, email: user.email },
      create: {
        userId,
        provider: "GMAIL",
        status: "CONNECTED",
        scopes,
        email: user.email,
      },
    });
  }
}
