import { NextResponse } from 'next/server';
import { getProjectsFiltered } from '@/lib/api';
import { createProject } from '@/lib/store';
import { projectSchema } from '@/lib/validators';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const priority = searchParams.get('priority') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  return NextResponse.json(getProjectsFiltered({ status, priority, search }));
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid project payload' }, { status: 400 });
  }

  const project = createProject(parsed.data);
  return NextResponse.json(project, { status: 201 });
}
