import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 });
    }

    // Disable 2FA for the patient
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return NextResponse.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
