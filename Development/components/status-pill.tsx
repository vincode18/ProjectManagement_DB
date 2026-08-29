import { priorityLabel, statusLabel } from '@/lib/format';
import type { PriorityLevel, ProjectStatus } from '@/lib/types';

export function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span className={`pill ${status === 'completed' ? 'bg-emerald-100 text-emerald-700' : status === 'delayed' ? 'bg-red-100 text-red-700' : status === 'planning' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
      {statusLabel(status)}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: PriorityLevel }) {
  return (
    <span className={`pill ${priority === 'high' ? 'bg-red-100 text-red-700' : priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
      {priorityLabel(priority)}
    </span>
  );
}

export function HealthPill({ level }: { level: 'On Track' | 'At Risk' | 'Critical' }) {
  const map = {
    'On Track': 'green',
    'At Risk': 'amber',
    Critical: 'red'
  } as const;
  return <span className={`pill ${map[level] === 'green' ? 'bg-emerald-100 text-emerald-700' : map[level] === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{level}</span>;
}
