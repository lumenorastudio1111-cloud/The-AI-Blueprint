# MeetingPrep.ai — AI Meeting Prep + Follow-up Agent

Connect Google Calendar and Gmail, and get an automatically generated **prep
brief** before every meeting and a **follow-up pack** (summary, decisions,
action items, draft email) after it. Built for consultants, founders, AEs,
CSMs, and agency owners who live in back-to-back client meetings.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth.js (Google OAuth)
- googleapis (Calendar + Gmail)
- Anthropic SDK for brief/summary generation, with a deterministic mock
  fallback so the app is fully explorable with zero API keys
- A small in-process background job queue for brief/summary generation

## Project structure

```
meeting-agent/
├── prisma/
│   ├── schema.prisma        # User, ConnectedAccount, Meeting, MeetingBrief,
│   │                        # MeetingSummary, ActionItem, EmailDraft, + NextAuth models
│   └── seed.ts              # Demo user + sample meetings/briefs/follow-ups
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── login/page.tsx              # Login page
│   │   ├── dashboard/page.tsx          # Upcoming + recent meetings
│   │   ├── meetings/[id]/page.tsx      # Prep brief + follow-up pack
│   │   ├── settings/page.tsx           # AI tone + email signature
│   │   ├── billing/page.tsx            # Billing placeholder
│   │   └── api/
│   │       ├── auth/[...nextauth]/     # NextAuth handler
│   │       ├── meetings/sync/          # Pull events from Google Calendar
│   │       └── meetings/[id]/
│   │           ├── brief/              # Generate/poll prep brief
│   │           ├── summary/            # Generate/poll follow-up pack
│   │           ├── draft/              # Edit follow-up email draft
│   │           ├── draft/send/         # Send via Gmail
│   │           └── action-items/[id]/  # Update an action item
│   ├── components/          # Nav, dashboard cards, meeting workspace, ui kit
│   ├── lib/
│   │   ├── ai/               # AI wrapper (client.ts) + prompts + mock generator
│   │   ├── google/           # Calendar + Gmail API integration
│   │   ├── jobs/             # In-process background job queue + job runners
│   │   ├── auth.ts           # NextAuth config
│   │   └── prisma.ts
│   └── types/                 # Shared TypeScript types
└── .env.example
```

## How the pieces fit together

- **Auth**: Google OAuth requests Calendar (readonly), Gmail (readonly +
  send) scopes at sign-in. On sign-in, `ConnectedAccount` rows are created
  for `GOOGLE_CALENDAR` and `GMAIL` so the dashboard can show independent
  connection status.
- **Calendar sync**: `POST /api/meetings/sync` pulls events (14 days ahead,
  7 days back) from the primary Google Calendar and upserts them into
  `Meeting`.
- **Prep brief**: `POST /api/meetings/[id]/brief` flips the brief to
  `GENERATING` and enqueues a background job that pulls recent Gmail
  threads with attendees, prior completed-meeting summaries, and calls the
  AI wrapper to produce attendee context, company context, likely goals,
  suggested questions, and risks. The UI polls `GET .../brief` until it's
  `READY`.
- **Follow-up pack**: same pattern via `POST /api/meetings/[id]/summary`
  (optionally takes free-text notes), producing a summary, decisions,
  action items, and a draft follow-up email.
- **Background jobs**: `src/lib/jobs/queue.ts` is a minimal in-process
  queue — no Redis required to run locally. For real multi-instance
  production scale, swap it for BullMQ + Redis (or a hosted queue) behind
  the same `enqueue()` interface; call sites don't change.
- **AI wrapper**: `src/lib/ai/client.ts` calls the Anthropic API when
  `ANTHROPIC_API_KEY` is set, and otherwise falls back to a deterministic
  mock generator (`src/lib/ai/mock.ts`) so the whole product can be
  explored locally without any AI provider key.

## Local setup

### 1. Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- A PostgreSQL database (local install, Docker, or a hosted instance)

### 2. Install dependencies

```bash
cd meeting-agent
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

At minimum, set `DATABASE_URL` to a real Postgres connection string and
generate a `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Everything else is optional for local development — see below.

### 4. Set up the database

```bash
npm run db:push     # create tables from prisma/schema.prisma
npm run db:seed     # load a demo user + sample meetings/briefs/follow-ups
```

### 5. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`.

### 6. Sign in

Two options, configured via env vars:

- **Demo login (recommended for local dev)** — set
  `ENABLE_DEMO_LOGIN="true"` in `.env` (already set in `.env.example`) and
  click **"Continue with demo account"** on `/login`. This signs you in as
  the seeded demo user (`demo@meetingprep.local`) with sample meetings, a
  ready prep brief, and a ready follow-up pack already in place — no Google
  Cloud setup required. Calendar sync and Gmail send are simulated for
  this account (see "What works without Google credentials" below).
- **Google sign-in (production path)** — set `GOOGLE_CLIENT_ID` and
  `GOOGLE_CLIENT_SECRET` (see below) and click **"Continue with Google"**.
  This is the real, fully-wired integration: your actual Calendar events
  sync in, real Gmail threads are used for context, and follow-up emails
  send through your Gmail account.

You can enable both at once; the login page shows whichever are configured.

### 7. (Optional) Set up Google OAuth

1. Create a project at the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Calendar API** and **Gmail API**.
3. Create an OAuth 2.0 Client ID (Web application).
4. Add `http://localhost:3000/api/auth/callback/google` as an authorized
   redirect URI.
5. Add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` to `.env`.
6. While your OAuth consent screen is in "Testing" mode, add your Google
   account as a test user.

### 8. (Optional) Set up a real AI provider

By default (no `ANTHROPIC_API_KEY`), brief and follow-up generation use a
deterministic mock generator — good enough to fully exercise the product
locally. To use real AI generation, set:

```
ANTHROPIC_API_KEY="sk-ant-..."
AI_MODEL="claude-sonnet-5"
```

## What works without Google credentials

The demo login lets you explore the entire product without any Google
setup:

- Dashboard, meeting detail, settings, and billing pages all work fully.
- Prep brief and follow-up generation work fully (using the mock AI
  generator unless `ANTHROPIC_API_KEY` is set).
- "Sync calendar" requires a connected Google account and will show an
  error toast otherwise — this is expected without real Calendar access.
- "Send email" simulates the send (logs to the server console and marks
  the draft as sent) when no Google account is connected, so the full
  UI flow is still testable end-to-end.

## Useful scripts

| Command             | Description                                   |
| -------------------- | ---------------------------------------------- |
| `npm run dev`         | Start the dev server                           |
| `npm run build`       | Production build                               |
| `npm run start`       | Run the production build                       |
| `npm run db:push`     | Push the Prisma schema to your database        |
| `npm run db:migrate`  | Create/apply a Prisma migration                |
| `npm run db:seed`     | Seed demo data                                 |
| `npm run db:studio`   | Open Prisma Studio                             |

## Known limitations (MVP scope)

- Linking a second OAuth provider (e.g. Google) to an account that
  originally signed in via demo login isn't handled — sign in with Google
  directly for the full Calendar/Gmail-connected experience.
- Billing is a static placeholder page; no payment provider is wired up.
- The background job queue is in-process and single-instance; see
  `src/lib/jobs/queue.ts` for the production scaling note.
