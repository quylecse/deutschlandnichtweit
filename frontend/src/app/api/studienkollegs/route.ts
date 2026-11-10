import { NextResponse } from 'next/server';
import { getStudienkollegs } from '@/app/lib/studienkollegs';

export async function GET() {
  try {
    const data = await getStudienkollegs();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'FAILED_TO_FETCH_STUDIENKOLLEGS' },
      { status: 500 }
    );
  }
}

