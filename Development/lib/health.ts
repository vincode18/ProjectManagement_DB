import { addDays, diffDays } from './date';
import type { Project, Task } from './types';

export type HealthLevel = 'On Track' | 'At Risk' | 'Critical';

export function calculateOverallProgress(tasks: Task[], fallback = 0) {
  if (tasks.length === 0) return fallback;
  return Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length);
}

export function calculateHealth(project: Project, tasks: Task[]): HealthLevel {
  const now = new Date();
  const end = new Date(project.endDate);

  if (project.status !== 'completed' && end < now) return 'Critical';

  const totalDays = Math.max(1, diffDays(new Date(project.startDate), end));
  const elapsedDays = Math.max(0, Math.min(totalDays, diffDays(new Date(project.startDate), now)));
  const expectedProgress = (elapsedDays / totalDays) * 100;
  const actualProgress = tasks.length > 0 ? calculateOverallProgress(tasks, project.progress) : project.progress;

  if (expectedProgress - actualProgress > 12) return 'At Risk';
  return 'On Track';
}

export function healthBadgeColor(level: HealthLevel) {
  if (level === 'Critical') return 'bg-red-100 text-red-700';
  if (level === 'At Risk') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

export function healthEmoji(level: HealthLevel) {
  if (level === 'Critical') return '🔴';
  if (level === 'At Risk') return '🟡';
  return '🟢';
}

export function elapsedWorkTime(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  if (now < start) return null;
  const days = diffDays(start, now) + 1;
  const workHours = days * 8;
  const workDays = Math.floor(workHours / 8);
  return `${workDays}d ${workHours % 8}h elapsed · 8h/day`;
}

export function shiftDateRange(startDate: string, endDate: string, days: number) {
  const start = addDays(new Date(startDate), days);
  const end = addDays(new Date(endDate), days);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
}
