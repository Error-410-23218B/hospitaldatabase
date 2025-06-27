import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Return doctor info excluding sensitive data except password hash for debugging
    return NextResponse.json({
      id: doctor.id,
      email: doctor.email,
      passwordHash: doctor.password,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
    });
  } catch (error) {
    console.error('Doctor debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
