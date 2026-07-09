import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@meetingprep.local";

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function main() {
  console.log("Seeding database with demo data...");

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: "Jordan Rivera",
      aiTone: "CONSULTATIVE",
      emailSignature: "Best,\nJordan Rivera\nFounder, Rivera Consulting",
      plan: "FREE",
    },
  });

  await prisma.connectedAccount.upsert({
    where: { userId_provider: { userId: user.id, provider: "GOOGLE_CALENDAR" } },
    update: {},
    create: {
      userId: user.id,
      provider: "GOOGLE_CALENDAR",
      status: "CONNECTED",
      email: DEMO_EMAIL,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      lastSyncedAt: new Date(),
    },
  });

  await prisma.connectedAccount.upsert({
    where: { userId_provider: { userId: user.id, provider: "GMAIL" } },
    update: {},
    create: {
      userId: user.id,
      provider: "GMAIL",
      status: "CONNECTED",
      email: DEMO_EMAIL,
      scopes: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
      ],
      lastSyncedAt: new Date(),
    },
  });

  // Clear existing demo meetings so the seed is idempotent.
  await prisma.meeting.deleteMany({ where: { userId: user.id } });

  // ---------------------------------------------------------------------
  // Upcoming meeting #1: has a ready prep brief so the UI can be explored
  // without needing to call an AI provider.
  // ---------------------------------------------------------------------
  const upcoming1 = await prisma.meeting.create({
    data: {
      userId: user.id,
      googleEventId: "demo-event-1",
      title: "Acme Corp - Renewal Discussion",
      description: "Quarterly check-in and renewal terms discussion with Acme Corp leadership.",
      location: "Google Meet",
      meetingLink: "https://meet.google.com/demo-acme",
      startTime: hoursFromNow(20),
      endTime: hoursFromNow(21),
      status: "UPCOMING",
      organizerEmail: DEMO_EMAIL,
      attendees: [
        { name: "Priya Shah", email: "priya.shah@acmecorp.com", company: "Acme Corp", responseStatus: "accepted" },
        { name: "Tom Becker", email: "tom.becker@acmecorp.com", company: "Acme Corp", responseStatus: "tentative" },
      ],
    },
  });

  await prisma.meetingBrief.create({
    data: {
      meetingId: upcoming1.id,
      status: "READY",
      generatedAt: new Date(),
      attendeeContext: [
        {
          name: "Priya Shah",
          email: "priya.shah@acmecorp.com",
          company: "Acme Corp",
          title: "VP of Operations",
          notes: "Economic buyer. Focused on cost predictability this renewal cycle.",
        },
        {
          name: "Tom Becker",
          email: "tom.becker@acmecorp.com",
          company: "Acme Corp",
          title: "Ops Manager",
          notes: "Day-to-day champion. Raised onboarding friction in past emails.",
        },
      ],
      companyContext:
        "Acme Corp is a mid-market logistics company (~450 employees). Customer since last year, currently on the Growth plan. Renewal is due in 3 weeks.",
      recentEmailContext: [
        {
          from: "priya.shah@acmecorp.com",
          subject: "Re: Q3 renewal terms",
          snippet: "We'd like to discuss flexible billing before committing to another annual term...",
          date: hoursFromNow(-72).toISOString(),
        },
        {
          from: "tom.becker@acmecorp.com",
          subject: "Onboarding friction for new team members",
          snippet: "Two of our new hires had trouble getting access set up last week...",
          date: hoursFromNow(-120).toISOString(),
        },
      ],
      priorMeetingContext:
        "Last meeting (Q2 business review): Acme confirmed satisfaction with core product but asked for a dedicated onboarding contact and clearer invoicing. Action item from that call (add dedicated onboarding contact) is still open.",
      likelyGoals: [
        "Negotiate more flexible billing terms for renewal",
        "Get resolution on onboarding/access issues for new hires",
        "Confirm the account team's support model for the next contract term",
      ],
      suggestedQuestions: [
        "What billing flexibility would make this renewal an easy yes for your finance team?",
        "Can you walk me through exactly what broke during the recent onboarding attempts?",
        "Who else, beyond you two, should be involved in the renewal decision?",
      ],
      risks: [
        "Open onboarding complaint from last quarter has not been resolved - address proactively before they raise it.",
        "Tom's tentative RSVP could mean a scheduling conflict on the champion side - confirm attendance.",
        "Competitor mentioned in passing in an earlier email thread - be ready to discuss differentiation if it comes up.",
      ],
    },
  });

  // ---------------------------------------------------------------------
  // Upcoming meeting #2: no brief yet (empty state / "Generate" demo)
  // ---------------------------------------------------------------------
  await prisma.meeting.create({
    data: {
      userId: user.id,
      googleEventId: "demo-event-2",
      title: "Intro Call - Northwind Retail",
      description: "First call with Northwind's Head of CX to scope a potential engagement.",
      location: "Zoom",
      meetingLink: "https://zoom.us/j/demo-northwind",
      startTime: hoursFromNow(46),
      endTime: hoursFromNow(46.5),
      status: "UPCOMING",
      organizerEmail: DEMO_EMAIL,
      attendees: [
        { name: "Elena Cruz", email: "elena.cruz@northwindretail.com", company: "Northwind Retail", responseStatus: "accepted" },
      ],
    },
  });

  // ---------------------------------------------------------------------
  // Upcoming meeting #3: soon, no brief
  // ---------------------------------------------------------------------
  await prisma.meeting.create({
    data: {
      userId: user.id,
      googleEventId: "demo-event-3",
      title: "Weekly Sync - Product Team",
      description: "Internal weekly sync.",
      location: "Google Meet",
      startTime: hoursFromNow(4),
      endTime: hoursFromNow(4.5),
      status: "UPCOMING",
      organizerEmail: DEMO_EMAIL,
      attendees: [
        { name: "Sam Lee", email: "sam@internal.example.com", responseStatus: "accepted" },
      ],
    },
  });

  // ---------------------------------------------------------------------
  // Past meeting: has a full follow-up pack (summary + action items + draft)
  // ---------------------------------------------------------------------
  const past1 = await prisma.meeting.create({
    data: {
      userId: user.id,
      googleEventId: "demo-event-past-1",
      title: "Globex Industries - Discovery Call",
      description: "First discovery call to understand Globex's supply chain reporting needs.",
      location: "Google Meet",
      startTime: hoursFromNow(-48),
      endTime: hoursFromNow(-47),
      status: "COMPLETED",
      organizerEmail: DEMO_EMAIL,
      attendees: [
        { name: "Marcus Webb", email: "marcus.webb@globex.com", company: "Globex Industries", responseStatus: "accepted" },
        { name: "Dana Kim", email: "dana.kim@globex.com", company: "Globex Industries", responseStatus: "accepted" },
      ],
    },
  });

  const summary1 = await prisma.meetingSummary.create({
    data: {
      meetingId: past1.id,
      status: "READY",
      generatedAt: new Date(),
      summary:
        "Globex is evaluating tools to consolidate supply chain reporting across 3 regional warehouses. Current process is spreadsheet-based and error-prone. Marcus (Director of Supply Chain) is the decision maker; Dana (Analyst) will be the primary daily user. They want a pilot with one warehouse before rolling out company-wide. Budget cycle opens next month.",
      decisions: [
        "Proceed with a 2-warehouse pilot instead of a single warehouse, per Marcus's request.",
        "Globex will provide sample data exports by end of week for a tailored demo.",
      ],
    },
  });

  await prisma.actionItem.createMany({
    data: [
      {
        meetingSummaryId: summary1.id,
        description: "Send tailored demo environment configured for 2-warehouse pilot",
        owner: "Jordan Rivera",
        dueDate: hoursFromNow(48),
      },
      {
        meetingSummaryId: summary1.id,
        description: "Share sample supply chain data exports for both warehouses",
        owner: "Dana Kim",
        dueDate: hoursFromNow(24),
      },
      {
        meetingSummaryId: summary1.id,
        description: "Confirm internal budget timeline with finance",
        owner: "Marcus Webb",
        dueDate: hoursFromNow(96),
      },
    ],
  });

  await prisma.emailDraft.create({
    data: {
      meetingId: past1.id,
      subject: "Great connecting today - next steps for the pilot",
      status: "DRAFT",
      body: `Hi Marcus and Dana,

Thanks for the great conversation today - it's clear the manual reporting process across your warehouses is costing your team real time every week.

To recap where we landed:
- We'll move forward with a 2-warehouse pilot rather than starting with just one.
- I'll get a tailored demo environment set up once we have your sample exports.
- Dana, whenever you get a chance to send over sample data from both warehouses, that'll help us configure the pilot to match your real reporting structure.

I'll follow up by end of week with the demo environment. In the meantime, let me know if any other stakeholders should be looped in before your budget cycle opens next month.

Best,
Jordan Rivera
Founder, Rivera Consulting`,
    },
  });

  // ---------------------------------------------------------------------
  // Past meeting: completed, no follow-up yet (empty state demo)
  // ---------------------------------------------------------------------
  await prisma.meeting.create({
    data: {
      userId: user.id,
      googleEventId: "demo-event-past-2",
      title: "Stonebridge Partners - Contract Review",
      description: "Walk through redlines on the updated MSA.",
      location: "Phone",
      startTime: hoursFromNow(-6),
      endTime: hoursFromNow(-5.5),
      status: "COMPLETED",
      organizerEmail: DEMO_EMAIL,
      attendees: [
        { name: "Alicia Wong", email: "alicia.wong@stonebridgepartners.com", company: "Stonebridge Partners", responseStatus: "accepted" },
      ],
    },
  });

  console.log("Seed complete.");
  console.log(`Demo user: ${DEMO_EMAIL}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
