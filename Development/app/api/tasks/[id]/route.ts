import { NextResponse } from 'next/server';
import { deleteTask, updateTask } from '@/lib/store';
import { taskUpdateSchema } from '@/lib/validators';
import { mockData } from '@/lib/mock-data';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = taskUpdateSchema.partial().safeParse({ ...body, id: params.id });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid task payload' }, { status: 400 });
  }

  const task = updateTask(params.id, parsed.data);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const projectTasks = mockData.tasks.filter((item) => item.projectId === task.projectId);
  const project = mockData.projects.find((item) => item.id === task.projectId);
  if (project) {
    project.progress = Math.round(projectTasks.reduce((sum, item) => sum + item.progress, 0) / Math.max(1, projectTasks.length));
  }

  return NextResponse.json(task);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const deleted = deleteTask(params.id);
  if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
