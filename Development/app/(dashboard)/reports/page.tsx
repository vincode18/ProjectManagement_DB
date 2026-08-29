import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, ProgressBar } from '@/components/ui';
import { getReportsRows } from '@/lib/api';

export default function ReportsPage() {
  const rows = getReportsRows();

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Compact table of all projects for review and print." />
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-4 py-3 text-left">Project</th>
                <th className="border-b border-border px-4 py-3 text-left">Manager</th>
                <th className="border-b border-border px-4 py-3 text-left">Schedule</th>
                <th className="border-b border-border px-4 py-3 text-left">Progress</th>
                <th className="border-b border-border px-4 py-3 text-left">Health</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border-b border-border px-4 py-3">
                    <Link href={`/projects/${row.id}`} className="font-semibold text-ink hover:text-primary">{row.name} <span className="text-muted">({row.code})</span></Link>
                  </td>
                  <td className="border-b border-border px-4 py-3">{row.manager?.name ?? '—'}</td>
                  <td className="border-b border-border px-4 py-3 text-muted">{row.schedule}</td>
                  <td className="border-b border-border px-4 py-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted"><span>{row.overallProgress}%</span></div>
                      <ProgressBar value={row.overallProgress} />
                    </div>
                  </td>
                  <td className="border-b border-border px-4 py-3">{row.health}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
