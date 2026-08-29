import { NextResponse } from 'next/server';
import { getProjectDetail } from '@/lib/api';
import { deleteProject, updateProject } from '@/lib/store';
import { projectSchema } from '@/lib/validators';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectDetail(id);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = projectSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid project payload' }, { status: 400 });
  }

  const project = await updateProject(id, parsed.data);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deleteProject(id);
  if (!deleted) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
