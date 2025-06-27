import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        email: true,
        services: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
