import { NextResponse } from 'next/server';
import { getTasksByProject } from '@/lib/api';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(await getTasksByProject(id));
}
