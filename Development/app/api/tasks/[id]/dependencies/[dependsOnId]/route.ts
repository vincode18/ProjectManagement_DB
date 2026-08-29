import { NextResponse } from 'next/server';
import { deleteDependency } from '@/lib/store';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; dependsOnId: string }> }) {
  const { id, dependsOnId } = await params;
  const deleted = await deleteDependency(id, dependsOnId);
  if (!deleted) return NextResponse.json({ error: 'Dependency not found' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
