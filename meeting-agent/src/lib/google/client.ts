import { google } from "googleapis";

import { prisma } from "@/lib/prisma";

/**
 * Builds an authenticated Google OAuth2 client for a user's linked Google
 * account, refreshing the access token first if it has expired and
 * persisting the refreshed token back to the Account row.
 *
 * Returns null if the user has no linked Google account (e.g. demo login).
 */
export async function getGoogleClientForUser(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account?.access_token) return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  const isExpired = account.expires_at ? account.expires_at * 1000 < Date.now() : false;

  if (isExpired && account.refresh_token) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date
            ? Math.floor(credentials.expiry_date / 1000)
            : undefined,
        },
      });
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error("[google] failed to refresh access token", error);
      return null;
    }
  }

  return oauth2Client;
}
