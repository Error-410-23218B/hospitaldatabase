import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 });
    }

    // Set smsenabled to true for the patient without changing twoFactorEnabled
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        smsenabled: true,
      },
    });

    return NextResponse.json({ message: 'SMS 2FA enabled successfully' });
  } catch (error) {
    console.error('Error enabling SMS 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
