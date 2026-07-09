export type Attendee = {
  name: string;
  email: string;
  company?: string;
  responseStatus?: "accepted" | "declined" | "tentative" | "needsAction";
};

export type EmailContextItem = {
  from: string;
  subject: string;
  snippet: string;
  date: string; // ISO string
};

export type AttendeeContext = {
  name: string;
  email: string;
  company?: string;
  title?: string;
  notes?: string;
};

export type BriefGenerationInput = {
  meetingTitle: string;
  meetingDescription?: string | null;
  startTime: string;
  attendees: Attendee[];
  recentEmails: EmailContextItem[];
  priorMeetingSummaries: string[];
  tone: string;
  userName: string;
};

export type BriefGenerationResult = {
  attendeeContext: AttendeeContext[];
  companyContext: string;
  recentEmailContext: EmailContextItem[];
  priorMeetingContext: string;
  likelyGoals: string[];
  suggestedQuestions: string[];
  risks: string[];
};

export type SummaryGenerationInput = {
  meetingTitle: string;
  meetingDescription?: string | null;
  attendees: Attendee[];
  tone: string;
  emailSignature: string;
  userName: string;
  notes?: string;
};

export type ActionItemDraft = {
  description: string;
  owner?: string;
  dueDate?: string | null;
};

export type SummaryGenerationResult = {
  summary: string;
  decisions: string[];
  actionItems: ActionItemDraft[];
  followUpEmail: {
    subject: string;
    body: string;
  };
};
