import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

export function formatMeetingTime(start: Date, end: Date): string {
  const day = isToday(start)
    ? "Today"
    : isTomorrow(start)
    ? "Tomorrow"
    : format(start, "EEE, MMM d");
  return `${day} · ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
}

export function formatRelative(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDateInput(date: Date | null | undefined): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}
