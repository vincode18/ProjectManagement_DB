import { NextResponse } from 'next/server';
import { deletePlannerSlot } from '@/lib/store';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deletePlannerSlot(id);
  if (!deleted) return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
