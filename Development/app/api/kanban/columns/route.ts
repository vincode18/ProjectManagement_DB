import { NextResponse } from 'next/server';
import { getKanbanColumns } from '@/lib/api';
import { setKanbanColumnLabel } from '@/lib/store';
import { z } from 'zod';

const bodySchema = z.object({
  status: z.enum(['not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'delayed']),
  label: z.string().min(1)
});

export async function GET() {
  return NextResponse.json(await getKanbanColumns());
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 });
  }

  const config = await setKanbanColumnLabel(parsed.data.status, parsed.data.label);
  return NextResponse.json(config);
}
