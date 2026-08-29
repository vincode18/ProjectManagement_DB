import { NextResponse } from 'next/server';
import { addDependency } from '@/lib/store';
import { dependencySchema } from '@/lib/validators';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const normalized = {
    dependsOnTaskId: body.depends_on_task_id ?? body.dependsOnTaskId,
    type: body.type
  };
  const parsed = dependencySchema.safeParse(normalized);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid dependency payload' }, { status: 400 });
  }

  return NextResponse.json(addDependency(params.id, parsed.data.dependsOnTaskId, parsed.data.type), { status: 201 });
}
