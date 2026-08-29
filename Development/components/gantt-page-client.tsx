'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from './ui';
import { Modal } from './modal';
import { GanttChart, type GanttRowItem } from './gantt-chart';
import type { Task } from '@/lib/types';

interface GanttPageClientProps {
  projectRows: GanttRowItem[];
  tasksByProject: Record<string, Task[]>;
}

export function GanttPageClient({ projectRows, tasksByProject }: GanttPageClientProps) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const expandedProject = projectRows.find((row) => row.id === expandedProjectId) ?? null;
  const taskRows: GanttRowItem[] = useMemo(() => {
    if (!expandedProjectId) return [];
    return (tasksByProject[expandedProjectId] ?? []).map((task) => ({
      id: task.id,
      title: `${task.wbsCode} · ${task.name}`,
      startDate: task.startDate,
      endDate: task.endDate,
      status: task.status
    }));
  }, [expandedProjectId, tasksByProject]);

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <GanttChart
            rows={projectRows}
            draggable
            patchEndpoint={(id) => `/api/projects/${id}`}
            onRowClick={(id) => setExpandedProjectId(id)}
          />
        </CardContent>
      </Card>

      <Modal open={!!expandedProjectId} onClose={() => setExpandedProjectId(null)} title={expandedProject ? `${expandedProject.title} — Task Timeline` : ''}>
        <div className="-m-5 max-w-[80vw]">
          <GanttChart rows={taskRows} draggable={false} emptyLabel="No tasks in this project yet." />
        </div>
      </Modal>
    </>
  );
}
