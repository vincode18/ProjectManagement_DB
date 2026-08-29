import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_COLORS, STATUS_LABELS } from './date';
import type { PriorityLevel, ProjectStatus } from './types';

export function statusLabel(status: ProjectStatus) {
  return STATUS_LABELS[status];
}

export function priorityLabel(priority: PriorityLevel) {
  return PRIORITY_LABELS[priority];
}

export function statusColor(status: ProjectStatus) {
  return STATUS_COLORS[status];
}

export function priorityColor(priority: PriorityLevel) {
  return PRIORITY_COLORS[priority];
}
