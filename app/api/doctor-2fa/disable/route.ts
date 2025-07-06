import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: '2FA feature is disabled' }, { status: 400 });
}
