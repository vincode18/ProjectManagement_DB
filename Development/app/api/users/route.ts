import { NextResponse } from 'next/server';
import { mockData } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(mockData.users);
}
