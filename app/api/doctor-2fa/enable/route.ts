import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { doctorId, token } = await request.json();

    if (!doctorId || !token) {
      return NextResponse.json({ error: 'Missing doctorId or token' }, { status: 400 });
    }

    // For now, just return an error since 2FA is removed
    return NextResponse.json({ error: '2FA feature is disabled' }, { status: 400 });
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
