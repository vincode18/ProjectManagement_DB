import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, ProgressBar } from '@/components/ui';
import { mockData } from '@/lib/mock-data';
import { elapsedWorkTime } from '@/lib/health';
import { PriorityPill, StatusPill } from '@/components/status-pill';
import { formatDate } from '@/lib/date';

const statuses = ['not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'delayed'] as const;

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Kanban" subtitle="Projects grouped by workflow status." />
      <div className="grid gap-4 xl:grid-cols-6">
        {statuses.map((status) => {
          const items = mockData.projects.filter((project) => project.status === status);
          return (
            <Card key={status}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="section-title capitalize">{status.replaceAll('_', ' ')}</h2>
                  <span className="pill bg-slate-100 text-slate-700">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-xl border border-border p-3 transition hover:border-primary/40 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="label">{project.code}</p>
                          <p className="mt-1 font-semibold text-ink">{project.name}</p>
                        </div>
                        <StatusPill status={project.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <PriorityPill priority={project.priority} />
                      </div>
                      <div className="mt-3 space-y-2">
                        <ProgressBar value={project.progress} />
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>{project.progress}%</span>
                          <span>{elapsedWorkTime(project.startDate) ?? 'Not started'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
