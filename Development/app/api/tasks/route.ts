import { NextResponse } from 'next/server';
import { createTask } from '@/lib/store';
import { taskSchema } from '@/lib/validators';

export async function POST(request: Request) {
  const body = await request.json();
  const normalized = {
    ...body,
    projectId: body.project_id ?? body.projectId,
    parentTaskId: body.parent_task_id ?? body.parentTaskId ?? null,
    assigneeId: body.assignee_id ?? body.assigneeId ?? null
  };
  const parsed = taskSchema.safeParse(normalized);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid task payload' }, { status: 400 });
  }

  return NextResponse.json(createTask(parsed.data), { status: 201 });
}
