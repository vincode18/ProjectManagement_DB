import Link from 'next/link';
import { Card, CardContent, ProgressBar } from './ui';
import { StatusPill, PriorityPill, HealthPill } from './status-pill';
import { formatDate } from '@/lib/date';
import type { Project } from '@/lib/types';

export function ProjectCard({ project }: { project: Project & { health?: 'On Track' | 'At Risk' | 'Critical'; overallProgress?: number; owner?: { name: string } | null } }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="space-y-4 p-5 pt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label">{project.code}</p>
              <h3 className="mt-1 text-lg font-bold text-ink">{project.name}</h3>
            </div>
            <StatusPill status={project.status} />
          </div>
          <p className="text-sm text-muted">Owner: {project.owner?.name ?? '—'}</p>
          <p className="text-sm text-muted">{formatDate(project.startDate)} – {formatDate(project.endDate)}</p>
          <div className="flex flex-wrap gap-2">
            <PriorityPill priority={project.priority} />
            <HealthPill level={project.health ?? 'On Track'} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Progress</span>
              <span>{project.overallProgress ?? project.progress}%</span>
            </div>
            <ProgressBar value={project.overallProgress ?? project.progress} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
