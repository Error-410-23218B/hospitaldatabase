import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 });
    }

    // Disable SMS 2FA for the patient by clearing smsenabled flag
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        smsenabled: false,
      },
    });

    return NextResponse.json({ message: 'SMS 2FA disabled successfully' });
  } catch (error) {
    console.error('Error disabling SMS 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
