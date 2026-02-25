import { NextResponse } from 'next/server';
import { getRecent } from '@/lib/store';

export async function GET() {
  const recent = await getRecent(20);
  return NextResponse.json(recent);
}
