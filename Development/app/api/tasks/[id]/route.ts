import { NextResponse } from 'next/server';
import { deleteTask, updateTask } from '@/lib/store';
import { taskUpdateSchema } from '@/lib/validators';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = taskUpdateSchema.partial().safeParse({ ...body, id });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid task payload' }, { status: 400 });
  }

  const task = await updateTask(id, parsed.data);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  return NextResponse.json(task);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deleteTask(id);
  if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
