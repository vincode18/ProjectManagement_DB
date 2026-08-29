import { NextResponse } from 'next/server';
import { getTasksByProject } from '@/lib/api';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(getTasksByProject(params.id));
}
