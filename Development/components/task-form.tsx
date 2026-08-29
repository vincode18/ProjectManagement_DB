'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project, Task, User } from '@/lib/types';
import { Button, Card, CardContent, CardHeader, Input, Select } from './ui';

interface TaskFormProps {
  project: Project;
  tasks: Task[];
  users: User[];
  initialValues?: Partial<Task>;
  mode: 'create' | 'edit';
  onClose?: () => void;
}

const statusOptions = ['not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'delayed'] as const;
const priorityOptions = ['high', 'medium', 'low'] as const;
const dependencyOptions = ['FS', 'SS', 'FF', 'SF'] as const;

export function TaskForm({ project, tasks, users, initialValues, mode, onClose }: TaskFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [dependsOnTaskId, setDependsOnTaskId] = useState('');
  const [dependencyType, setDependencyType] = useState<(typeof dependencyOptions)[number]>('FS');

  const [form, setForm] = useState({
    projectId: project.id,
    parentTaskId: initialValues?.parentTaskId ?? '',
    wbsCode: initialValues?.wbsCode ?? '',
    name: initialValues?.name ?? '',
    assigneeId: initialValues?.assigneeId ?? '',
    startDate: initialValues?.startDate?.slice(0, 10) ?? '',
    endDate: initialValues?.endDate?.slice(0, 10) ?? '',
    progress: initialValues?.progress ?? 0,
    status: (initialValues?.status ?? 'not_started') as Task['status'],
    priority: (initialValues?.priority ?? 'medium') as Task['priority'],
    isMilestone: initialValues?.isMilestone ?? false,
    remarks: initialValues?.remarks ?? ''
  });

  const endpoint = useMemo(() => (mode === 'create' ? '/api/tasks' : `/api/tasks/${initialValues?.id}`), [initialValues?.id, mode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const payload = {
      ...form,
      parentTaskId: form.parentTaskId || null,
      assigneeId: form.assigneeId || null,
      remarks: form.remarks || null,
      progress: Number(form.progress)
    };

    const response = await fetch(endpoint, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setSaving(false);
      setMessage(data?.error ?? 'Unable to save task');
      return;
    }

    if (mode === 'create' && dependsOnTaskId && data?.id) {
      await fetch(`/api/tasks/${data.id}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depends_on_task_id: dependsOnTaskId, type: dependencyType })
      });
    }

    setSaving(false);
    setMessage('Saved successfully');
    router.refresh();
    if (mode === 'create') {
      setForm({
        projectId: project.id,
        parentTaskId: '',
        wbsCode: '',
        name: '',
        assigneeId: '',
        startDate: '',
        endDate: '',
        progress: 0,
        status: 'not_started',
        priority: 'medium',
        isMilestone: false,
        remarks: ''
      });
      setDependsOnTaskId('');
    }
    if (onClose) onClose();
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <p className="label">{mode === 'create' ? 'Add task' : 'Edit task'}</p>
          <h3 className="section-title mt-1">{mode === 'create' ? 'New Task' : form.name || 'Task details'}</h3>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input placeholder="Task name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <Input placeholder="WBS code" value={form.wbsCode} onChange={(event) => setForm((current) => ({ ...current, wbsCode: event.target.value }))} />
          <Select value={form.assigneeId} onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value }))}>
            <option value="">Unassigned</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </Select>
          <Select value={form.parentTaskId} onChange={(event) => setForm((current) => ({ ...current, parentTaskId: event.target.value }))}>
            <option value="">No parent task</option>
            {tasks.map((task) => <option key={task.id} value={task.id}>{task.wbsCode} · {task.name}</option>)}
          </Select>
          <Input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
          <Input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
          <Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Task['status'] }))}>
            {statusOptions.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
          </Select>
          <Select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as Task['priority'] }))}>
            {priorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
          <Input type="number" min="0" max="100" value={form.progress} onChange={(event) => setForm((current) => ({ ...current, progress: Number(event.target.value) }))} />
          <label className="flex items-center gap-2 rounded-input border border-border px-3 py-2 text-sm text-muted md:col-span-1">
            <input type="checkbox" checked={form.isMilestone} onChange={(event) => setForm((current) => ({ ...current, isMilestone: event.target.checked }))} />
            Milestone
          </label>
          <Select value={dependsOnTaskId} onChange={(event) => setDependsOnTaskId(event.target.value)}>
            <option value="">No dependency</option>
            {tasks.filter((task) => task.id !== initialValues?.id).map((task) => <option key={task.id} value={task.id}>{task.wbsCode} · {task.name}</option>)}
          </Select>
          <Select value={dependencyType} onChange={(event) => setDependencyType(event.target.value as typeof dependencyType)}>
            {dependencyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
          <textarea className="input min-h-24 md:col-span-2" placeholder="Remarks" value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} />
          <div className="flex items-center justify-end gap-3 md:col-span-2">
            {message ? <p className="text-sm text-muted">{message}</p> : null}
            {onClose ? <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button> : null}
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save task'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
