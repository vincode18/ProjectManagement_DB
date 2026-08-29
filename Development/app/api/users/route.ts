import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/api';

export async function GET() {
  return NextResponse.json(await getUsers());
}
