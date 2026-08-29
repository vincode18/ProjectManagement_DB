'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Card, CardContent, ProgressBar, Button } from './ui';
import { StatusPill } from './status-pill';
import { formatDate } from '@/lib/date';
import type { Task } from '@/lib/types';

interface ReportRow {
  id: string;
  code: string;
  name: string;
  manager: { name: string } | null;
  schedule: string;
  overallProgress: number;
  health: string;
  tasks: Task[];
}

export function ReportsTable({ rows }: { rows: ReportRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch('/api/reports/export');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'project-report.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4" />
          {exporting ? 'Preparing…' : 'Download Excel (.xlsx)'}
        </Button>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="border-b border-border px-4 py-3 text-left"></th>
                <th className="border-b border-border px-4 py-3 text-left">Project</th>
                <th className="border-b border-border px-4 py-3 text-left">Manager</th>
                <th className="border-b border-border px-4 py-3 text-left">Schedule</th>
                <th className="border-b border-border px-4 py-3 text-left">Progress</th>
                <th className="border-b border-border px-4 py-3 text-left">Health</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isOpen = expanded.has(row.id);
                return (
                  <Fragment key={row.id}>
                    <tr>
                      <td className="border-b border-border px-2 py-3">
                        <button type="button" onClick={() => toggle(row.id)} className="text-muted hover:text-primary" aria-label="Toggle tasks">
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="border-b border-border px-4 py-3">
                        <Link href={`/projects/${row.id}`} className="font-semibold text-ink hover:text-primary">
                          {row.name} <span className="text-muted">({row.code})</span>
                        </Link>
                      </td>
                      <td className="border-b border-border px-4 py-3">{row.manager?.name ?? '—'}</td>
                      <td className="border-b border-border px-4 py-3 text-muted">{row.schedule}</td>
                      <td className="border-b border-border px-4 py-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted">
                            <span>{row.overallProgress}%</span>
                          </div>
                          <ProgressBar value={row.overallProgress} />
                        </div>
                      </td>
                      <td className="border-b border-border px-4 py-3">{row.health}</td>
                    </tr>
                    {isOpen ? (
                      <tr>
                        <td className="border-b border-border bg-slate-50 px-2 py-3" />
                        <td colSpan={5} className="border-b border-border bg-slate-50 px-4 py-3">
                          {row.tasks.length === 0 ? (
                            <p className="text-sm text-muted">No tasks yet.</p>
                          ) : (
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="text-left text-muted">
                                  <th className="py-1 pr-4">WBS</th>
                                  <th className="py-1 pr-4">Task</th>
                                  <th className="py-1 pr-4">Assignee</th>
                                  <th className="py-1 pr-4">Status</th>
                                  <th className="py-1 pr-4">Progress</th>
                                  <th className="py-1 pr-4">Dates</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.tasks.map((task) => (
                                  <tr key={task.id}>
                                    <td className="py-1.5 pr-4 font-mono">{task.wbsCode}</td>
                                    <td className="py-1.5 pr-4">{task.name}</td>
                                    <td className="py-1.5 pr-4">{(task as any).assignee?.name ?? task.assigneeId ?? '—'}</td>
                                    <td className="py-1.5 pr-4">
                                      <StatusPill status={task.status} />
                                    </td>
                                    <td className="py-1.5 pr-4">{task.progress}%</td>
                                    <td className="py-1.5 pr-4 text-muted">
                                      {formatDate(task.startDate)} – {formatDate(task.endDate)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
