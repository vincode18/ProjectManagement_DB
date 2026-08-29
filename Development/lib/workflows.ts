import { addDays, diffDays, startOfWeek } from './date';

export function calculateGanttRange(startDates: string[], endDates: string[]) {
  if (startDates.length === 0 || endDates.length === 0) {
    const today = new Date();
    return {
      start: addDays(today, -3),
      end: addDays(today, 5)
    };
  }

  const starts = startDates.map((value) => new Date(value).getTime());
  const ends = endDates.map((value) => new Date(value).getTime());
  const start = addDays(new Date(Math.min(...starts)), -3);
  const end = addDays(new Date(Math.max(...ends)), 5);
  return { start, end };
}

export function ganttLeft(start: Date, rangeStart: Date, rangeEnd: Date) {
  const total = Math.max(1, diffDays(rangeStart, rangeEnd));
  return ((diffDays(rangeStart, start) / total) * 100).toFixed(2);
}

export function ganttWidth(start: Date, end: Date, rangeStart: Date, rangeEnd: Date) {
  const total = Math.max(1, diffDays(rangeStart, rangeEnd));
  return (((diffDays(start, end) + 1) / total) * 100).toFixed(2);
}

export function weekRangeLabel(start: Date) {
  const end = addDays(start, 6);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function buildWeekColumns(rangeStart: Date, rangeEnd: Date) {
  const weeks: { start: Date; end: Date }[] = [];
  let cursor = startOfWeek(rangeStart);
  const end = startOfWeek(rangeEnd);
  while (cursor <= end) {
    weeks.push({ start: new Date(cursor), end: addDays(cursor, 6) });
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export function barOffsetPx(weeksStart: Date, target: Date, weekWidth: number) {
  return (diffDays(weeksStart, target) / 7) * weekWidth;
}

export function barWidthPx(start: Date, end: Date, weekWidth: number) {
  return Math.max(8, ((diffDays(start, end) + 1) / 7) * weekWidth);
}

export function workingTimer(startDate: string, status: string) {
  if (status === 'completed') return 'Completed';
  const start = new Date(startDate);
  const today = new Date();
  if (today < start) return 'Not started';
  const days = diffDays(start, today) + 1;
  const hours = days * 8;
  const d = Math.floor(hours / 8);
  const h = hours % 8;
  return `${d}d ${h}h elapsed · 8h/day`;
}
