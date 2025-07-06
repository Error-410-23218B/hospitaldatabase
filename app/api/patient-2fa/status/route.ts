import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        twoFactorEnabled: true,
        smsenabled: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      twoFactorEnabled: patient.twoFactorEnabled,
      smsenabled: patient.smsenabled,
    });
  } catch (error) {
    console.error('Error fetching 2FA status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
