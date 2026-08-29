'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project, User } from '@/lib/types';
import { Button, Card, CardContent, CardHeader, Input, Select } from './ui';

interface ProjectFormProps {
  mode: 'create' | 'edit';
  users: User[];
  initialValues?: Partial<Project>;
}

const statusOptions = ['not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'delayed'] as const;
const priorityOptions = ['high', 'medium', 'low'] as const;

export function ProjectForm({ mode, users, initialValues }: ProjectFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    code: initialValues?.code ?? '',
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    managerId: initialValues?.managerId ?? users[0]?.id ?? '',
    ownerId: initialValues?.ownerId ?? users[1]?.id ?? users[0]?.id ?? '',
    techLeadId: initialValues?.techLeadId ?? '',
    startDate: initialValues?.startDate?.slice(0, 10) ?? '',
    endDate: initialValues?.endDate?.slice(0, 10) ?? '',
    status: (initialValues?.status ?? 'not_started') as Project['status'],
    priority: (initialValues?.priority ?? 'medium') as Project['priority'],
    progress: initialValues?.progress ?? 0
  });

  const endpoint = useMemo(() => (mode === 'create' ? '/api/projects' : `/api/projects/${initialValues?.id}`), [initialValues?.id, mode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const payload = {
      ...form,
      techLeadId: form.techLeadId || null,
      progress: Number(form.progress)
    };

    const response = await fetch(endpoint, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setMessage(data?.error ?? 'Unable to save project');
      return;
    }

    if (mode === 'create' && data?.id) {
      router.push(`/projects/${data.id}`);
      router.refresh();
      return;
    }

    setMessage('Saved successfully');
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="label">{mode === 'create' ? 'Create project' : 'Edit project'}</p>
            <h3 className="section-title mt-1">{mode === 'create' ? 'New Project' : 'Project settings'}</h3>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input placeholder="Project code" value={form.code} disabled={mode === 'edit'} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
          <Input placeholder="Project name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <textarea className="input min-h-28 md:col-span-2" placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          <Select value={form.managerId} onChange={(event) => setForm((current) => ({ ...current, managerId: event.target.value }))}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </Select>
          <Select value={form.ownerId} onChange={(event) => setForm((current) => ({ ...current, ownerId: event.target.value }))}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </Select>
          <Select value={form.techLeadId} onChange={(event) => setForm((current) => ({ ...current, techLeadId: event.target.value }))}>
            <option value="">No technical lead</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </Select>
          <Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Project['status'] }))}>
            {statusOptions.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
          </Select>
          <Select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as Project['priority'] }))}>
            {priorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
          <Input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
          <Input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
          <Input type="number" min="0" max="100" value={form.progress} onChange={(event) => setForm((current) => ({ ...current, progress: Number(event.target.value) }))} />
          <div className="flex items-center justify-end gap-3 md:col-span-2">
            {message ? <p className="text-sm text-muted">{message}</p> : null}
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save project'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
