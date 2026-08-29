export const STATUS_LABELS = {
  not_started: 'Not Started',
  planning: 'Planning',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  delayed: 'Delayed'
} as const;

export const STATUS_ORDER = ['not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'delayed'] as const;

export const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low'
} as const;

export const STATUS_COLORS: Record<string, string> = {
  not_started: '#64748B',
  planning: '#7C3AED',
  in_progress: '#2563EB',
  on_hold: '#B45309',
  completed: '#15803D',
  delayed: '#B42318'
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: '#B42318',
  medium: '#B45309',
  low: '#64748B'
};

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
}

export function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function diffDays(start: Date, end: Date) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / ms);
}

export function overlaps(startA: string, endA: string, startB: string, endB: string) {
  return new Date(startA) <= new Date(endB) && new Date(endA) >= new Date(startB);
}

export function isCurrentWeek(weekStart: Date) {
  const today = startOfWeek(new Date());
  return weekStart.toDateString() === today.toDateString();
}

export function isToday(date: Date) {
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
