import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { RefreshButton } from '@/components/refresh-button';
import { SummaryCard } from '@/components/summary-card';
import { ProjectCard } from '@/components/project-card';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { getDashboardSummary } from '@/lib/api';
import { formatShortDate } from '@/lib/date';
import { healthEmoji, healthBadgeColor } from '@/lib/health';
import { StatusPill } from '@/components/status-pill';

export default function DashboardPage() {
  const data = getDashboardSummary();
  const today = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Today: ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
        actions={<RefreshButton />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Total Projects" value={data.totalProjects} />
        <SummaryCard label="Active Projects" value={data.activeProjects} />
        <SummaryCard label="Completed" value={data.completed} />
        <SummaryCard label="Delayed" value={data.delayed} />
        <SummaryCard label="Upcoming" value={data.upcoming} />
        <SummaryCard label="Overall Progress" value={`${data.overallProgress}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <p className="label">Status Distribution</p>
              <h2 className="section-title mt-1">All project statuses</h2>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.statusCounts.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.label.replaceAll('_', ' ')}</p>
                  <p className="text-xs text-muted">Status count</p>
                </div>
                <StatusPill status={item.status as any} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="label">Upcoming Milestones</p>
              <h2 className="section-title mt-1">Next checkpoints</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingMilestones.map((task) => (
              <Link key={task.id} href={`/projects/${task.projectId}`} className="block rounded-xl border border-border p-3 transition hover:border-primary/40 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{task.name}</p>
                    <p className="text-xs text-muted">{task.project?.code}</p>
                  </div>
                  <p className="text-xs text-muted">{formatShortDate(task.endDate)}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <p className="label">Risk Panel</p>
            <h2 className="section-title mt-1">Project health snapshot</h2>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.riskProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="rounded-2xl border border-border p-4 transition hover:border-primary/40 hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label">{project.code}</p>
                  <h3 className="mt-1 font-semibold text-ink">{project.name}</h3>
                </div>
                <span className={`pill ${healthBadgeColor(project.health)}`}>{healthEmoji(project.health)}</span>
              </div>
              <p className="mt-3 text-sm text-muted">{formatShortDate(project.startDate)} – {formatShortDate(project.endDate)}</p>
              <p className="mt-1 text-sm text-muted">Progress: {project.overallProgress}%</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
