'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project, Task, User, TaskDependency } from '@/lib/types';
import { Card, CardContent, CardHeader, ProgressBar, Button } from './ui';
import { StatusPill, PriorityPill, HealthPill } from './status-pill';
import { formatDate } from '@/lib/date';
import { healthEmoji } from '@/lib/health';
import { TaskForm } from './task-form';
import { TaskProgressSlider } from './task-progress-slider';

interface Props {
  project: Project & { health: 'On Track' | 'At Risk' | 'Critical'; overallProgress: number; owner: User | null; manager: User | null; techLead: User | null; tasks: Task[] };
  tasks: Task[];
  users: User[];
  dependencies: TaskDependency[];
}

export function ProjectDetailClient({ project, tasks, users, dependencies }: Props) {
  const router = useRouter();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const depthMap = useMemo(() => {
    const map = new Map<string, number>();
    const byId = new Map(tasks.map((task) => [task.id, task]));

    function depthFor(task: Task): number {
      if (!task.parentTaskId) return 0;
      const parent = byId.get(task.parentTaskId);
      if (!parent) return 0;
      if (map.has(parent.id)) return (map.get(parent.id) ?? 0) + 1;
      const value = depthFor(parent) + 1;
      map.set(parent.id, value - 1);
      return value;
    }

    tasks.forEach((task) => map.set(task.id, depthFor(task)));
    return map;
  }, [tasks]);

  const dependencyMap = useMemo(() => {
    const map = new Map<string, string[]>();
    dependencies.forEach((dependency) => {
      const current = map.get(dependency.taskId) ?? [];
      current.push(`${dependency.type} → ${dependency.dependsOnTaskId}`);
      map.set(dependency.taskId, current);
    });
    return map;
  }, [dependencies]);

  async function deleteProject() {
    if (!confirm('Delete this project and all tasks?')) return;
    await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
    router.push('/projects');
    router.refresh();
  }

  async function deleteTask(task: Task) {
    if (tasks.some((item) => item.parentTaskId === task.id) && !confirm('This task has subtasks. Delete anyway?')) return;
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    router.refresh();
  }

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setShowProjectForm(false);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-slate-900 text-white">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">{project.code}</p>
              <h1 className="mt-2 text-2xl font-bold">{project.name}</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/70">{project.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill status={project.status} />
              <PriorityPill priority={project.priority} />
              <HealthPill level={project.health} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
            <span>Manager: {project.manager?.name ?? '—'}</span>
            <span>Owner: {project.owner?.name ?? '—'}</span>
            <span>Tech Lead: {project.techLead?.name ?? '—'}</span>
            <span>{healthEmoji(project.health)} {project.health}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-full">
              <ProgressBar value={project.overallProgress} />
            </div>
            <span className="min-w-14 text-right text-sm font-semibold">{project.overallProgress}%</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowProjectForm((current) => !current)}>{showProjectForm ? 'Close project form' : 'Edit Project'}</Button>
            <Button variant="ghost" onClick={deleteProject}>Delete Project</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="label">Project Manager</p><p className="mt-2 font-semibold">{project.manager?.name ?? '—'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="label">Business Owner</p><p className="mt-2 font-semibold">{project.owner?.name ?? '—'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="label">Technical Lead</p><p className="mt-2 font-semibold">{project.techLead?.name ?? '—'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="label">Health</p><p className="mt-2 font-semibold">{project.health}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="label">Schedule</p>
              <h2 className="section-title mt-1">Project timeline</h2>
            </div>
            <div className="text-sm text-muted">{formatDate(project.startDate)} – {formatDate(project.endDate)}</div>
          </div>
        </CardHeader>
        <CardContent>
          <ProgressBar value={project.overallProgress} />
        </CardContent>
      </Card>

      {showProjectForm ? <TaskForm project={{ ...project, startDate: project.startDate, endDate: project.endDate } as Project} tasks={tasks} users={users} mode="edit" initialValues={{ ...project }} onClose={() => setShowProjectForm(false)} /> : null}

      {editingTask ? <TaskForm project={{ ...project, startDate: project.startDate, endDate: project.endDate } as Project} tasks={tasks} users={users} mode="edit" initialValues={editingTask} onClose={() => setEditingTask(null)} /> : null}

      <Card>
        <CardHeader>
          <div>
            <p className="label">WBS</p>
            <h2 className="section-title mt-1">Work Breakdown Structure</h2>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 bg-surface text-left">
              <tr>
                <th className="border-b border-border px-4 py-3">WBS</th>
                <th className="border-b border-border px-4 py-3">Task / Dependency</th>
                <th className="border-b border-border px-4 py-3">Status</th>
                <th className="border-b border-border px-4 py-3">Progress</th>
                <th className="border-b border-border px-4 py-3">Timeline</th>
                <th className="border-b border-border px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="align-top">
                  <td className="border-b border-border px-4 py-3 font-mono text-xs">{task.wbsCode}</td>
                  <td className="border-b border-border px-4 py-3">
                    <div style={{ paddingLeft: `${(depthMap.get(task.id) ?? 0) * 16}px` }}>
                      <div className="font-medium text-ink">{task.name}{task.isMilestone ? ' ◆' : ''}</div>
                      <div className="text-xs text-muted">{dependencyMap.get(task.id)?.join(' · ') ?? 'No dependency'}{task.remarks ? ` · ${task.remarks}` : ''}</div>
                    </div>
                  </td>
                  <td className="border-b border-border px-4 py-3"><StatusPill status={task.status} /></td>
                  <td className="border-b border-border px-4 py-3">
                    <TaskProgressSlider taskId={task.id} initialProgress={task.progress} />
                  </td>
                  <td className="border-b border-border px-4 py-3 text-muted">{formatDate(task.startDate)} – {formatDate(task.endDate)}</td>
                  <td className="border-b border-border px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => openEditTask(task)}>Edit</Button>
                      <Button variant="ghost" onClick={() => deleteTask(task)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <TaskForm project={project} tasks={tasks} users={users} mode="create" />
    </div>
  );
}
