import { NextResponse } from 'next/server';
import { deleteDependency } from '@/lib/store';

export async function DELETE(_: Request, { params }: { params: { id: string; dependsOnId: string } }) {
  const deleted = deleteDependency(params.id, params.dependsOnId);
  if (!deleted) return NextResponse.json({ error: 'Dependency not found' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
