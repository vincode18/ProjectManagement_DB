import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui';
import { mockData } from '@/lib/mock-data';
import { addDays, formatShortDate, isToday, startOfWeek } from '@/lib/date';
import { calculateGanttRange, ganttLeft, ganttWidth, weekRangeLabel } from '@/lib/workflows';
import { statusColor } from '@/lib/format';

export default function GanttPage() {
  const rows = mockData.projects.map((project) => ({
    ...project,
    label: project.name,
    startDate: new Date(project.startDate),
    endDate: new Date(project.endDate)
  }));
  const range = calculateGanttRange(rows.map((row) => row.startDate.toISOString()), rows.map((row) => row.endDate.toISOString()));
  const rangeStart = range.start;
  const rangeEnd = range.end;
  const totalDays = Math.max(1, Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (24 * 60 * 60 * 1000)));
  const headerDays = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(rangeStart), index * Math.max(1, Math.floor(totalDays / 7))));

  return (
    <div className="space-y-6">
      <PageHeader title="Gantt" subtitle="Project-level timeline with today marker." />

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="min-w-[960px]">
            <div className="grid grid-cols-[260px_1fr] border-b border-border bg-slate-50">
              <div className="px-4 py-3 text-sm font-semibold">Project</div>
              <div className="grid grid-cols-7 text-sm font-semibold">
                {headerDays.map((day) => <div key={day.toISOString()} className="px-3 py-3">{formatShortDate(day.toISOString())}</div>)}
              </div>
            </div>
            {rows.map((row) => (
              <div key={row.id} className="relative grid grid-cols-[260px_1fr] border-b border-border">
                <div className="sticky left-0 bg-surface px-4 py-4">
                  <Link href={`/projects/${row.id}`} className="font-semibold text-ink">{row.name}</Link>
                  <p className="text-xs text-muted">{weekRangeLabel(row.startDate)}</p>
                </div>
                <div className="relative px-4 py-4">
                  <div className="relative h-10 rounded-xl bg-slate-100">
                    <div className="absolute inset-y-0 w-px bg-red-500" style={{ left: `${ganttLeft(new Date(), rangeStart, rangeEnd)}%` }} />
                    <div
                      className="absolute top-1/2 h-6 -translate-y-1/2 rounded-full"
                      style={{
                        left: `${ganttLeft(row.startDate, rangeStart, rangeEnd)}%`,
                        width: `${ganttWidth(row.startDate, row.endDate, rangeStart, rangeEnd)}%`,
                        background: statusColor(row.status)
                      }}
                    />
                    {isToday(row.startDate) ? <span className="absolute left-2 top-1 text-[10px] font-semibold uppercase tracking-wide">today</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
