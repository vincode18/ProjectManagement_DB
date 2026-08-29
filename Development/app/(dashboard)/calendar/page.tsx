import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui';
import { buildCalendarWeeks, getMonthProjects } from '@/lib/api';
import { formatMonthLabel, formatShortDate, isCurrentWeek, overlaps, startOfMonth, addDays } from '@/lib/date';
import { STATUS_COLORS } from '@/lib/date';

const filters = ['All Projects', 'My Projects', 'Active', 'Completed', 'Delayed', 'High Priority', 'Medium Priority', 'Low Priority'] as const;

export default function CalendarPage({ searchParams }: { searchParams?: { month?: string; filter?: string; search?: string } }) {
  const activeMonth = searchParams?.month ? new Date(searchParams.month) : new Date();
  const month = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
  const filter = searchParams?.filter ?? 'All Projects';
  const search = searchParams?.search ?? '';
  const projects = getMonthProjects(search, filter);
  const weeks = buildCalendarWeeks(month);

  const monthParam = month.toISOString().slice(0, 7);
  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1).toISOString().slice(0, 7);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="Weekly project distribution across the selected month."
        actions={
          <div className="flex items-center gap-2">
            <Link className="btn-secondary" href={`/calendar?month=${prevMonth}&filter=${filter}&search=${search}`}>Prev</Link>
            <div className="rounded-button border border-border bg-white px-4 py-2 text-sm font-semibold">{formatMonthLabel(month)}</div>
            <Link className="btn-secondary" href={`/calendar?month=${nextMonth}&filter=${filter}&search=${search}`}>Next</Link>
          </div>
        }
      />

      <form className="surface-card flex flex-wrap gap-2 p-4" method="get">
        <input type="hidden" name="month" value={monthParam} />
        <input className="input max-w-sm" name="search" defaultValue={search} placeholder="Search project name or code" />
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Link key={item} className={`rounded-full border px-3 py-2 text-sm font-semibold ${item === filter ? 'border-primary bg-primary text-white' : 'border-border bg-white text-ink'}`} href={`/calendar?month=${monthParam}&filter=${encodeURIComponent(item)}&search=${encodeURIComponent(search)}`}>{item}</Link>
          ))}
        </div>
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border-b border-border bg-surface px-4 py-3 text-left">Project</th>
                {weeks.map((week, index) => {
                  const current = isCurrentWeek(week[0]);
                  return <th key={index} className={`border-b border-border px-4 py-3 text-left ${current ? 'bg-blue-50' : ''}`}>{formatShortDate(week[0].toISOString())} – {formatShortDate(week[6].toISOString())}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="sticky left-0 z-10 border-b border-border bg-surface px-4 py-3 font-medium">
                    <Link href={`/projects/${project.id}`} className="text-ink hover:text-primary">{project.name}</Link>
                  </td>
                  {weeks.map((week, index) => {
                    const weekStart = week[0].toISOString();
                    const weekEnd = week[6].toISOString();
                    const matches = overlaps(project.startDate, project.endDate, weekStart, weekEnd);
                    const startLabel = new Date(project.startDate).toDateString() === week[0].toDateString();
                    return (
                      <td key={index} className={`border-b border-border px-4 py-3 ${isCurrentWeek(week[0]) ? 'bg-blue-50' : ''}`}>
                        {matches ? (
                          <Link href={`/projects/${project.id}`} className="flex items-center gap-2 rounded-xl px-3 py-2 text-white" style={{ background: STATUS_COLORS[project.status] }}>
                            {startLabel ? <span className="truncate text-sm font-semibold">{project.name}</span> : <span className="text-xs opacity-80">{project.code}</span>}
                          </Link>
                        ) : (
                          <div className="h-10 rounded-xl border border-dashed border-transparent" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
