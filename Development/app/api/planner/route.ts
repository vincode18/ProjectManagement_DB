import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPlannerForUser } from '@/lib/api';
import { createPlannerSlot } from '@/lib/store';

const bodySchema = z.object({
  userId: z.string().min(1).optional(),
  user_id: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
  task_id: z.string().min(1).optional(),
  date: z.string().min(1),
  hour: z.number().int().min(0).max(23)
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const data = await getPlannerForUser(userId, date);
  return NextResponse.json({ ...data, taskMap: Object.fromEntries(data.taskMap) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 });
  }

  const userId = parsed.data.userId ?? parsed.data.user_id;
  const taskId = parsed.data.taskId ?? parsed.data.task_id;

  if (!userId || !taskId) {
    return NextResponse.json({ error: 'userId and taskId are required' }, { status: 400 });
  }

  const slot = await createPlannerSlot({ userId, taskId, date: parsed.data.date, hour: parsed.data.hour });
  return NextResponse.json(slot, { status: 201 });
}
