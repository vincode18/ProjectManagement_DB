import { PageHeader } from '@/components/page-header';
import { GanttPageClient } from '@/components/gantt-page-client';
import { getAllProjectsRaw, getAllTasksRaw } from '@/lib/api';
import type { Task } from '@/lib/types';

export default async function GanttPage() {
  const [projects, tasks] = await Promise.all([getAllProjectsRaw(), getAllTasksRaw()]);

  const projectRows = projects.map((project) => ({
    id: project.id,
    title: project.name,
    subtitle: project.code,
    startDate: project.startDate,
    endDate: project.endDate,
    status: project.status
  }));

  const tasksByProject: Record<string, Task[]> = {};
  for (const task of tasks) {
    (tasksByProject[task.projectId] ??= []).push(task);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Gantt" subtitle="Project-level timeline with today marker. Click a project to drill down, drag bars to reschedule." />
      <GanttPageClient projectRows={projectRows} tasksByProject={tasksByProject} />
    </div>
  );
}
