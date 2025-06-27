import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { patientId: number };
    const patientId = decoded.patientId;
    if (!patientId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        address: true,
        emergencyContact: true,
        medicalInfo: true,
        preferences: true,
        stats: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { patientId: number };
    const patientId = decoded.patientId;
    if (!patientId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        dob: new Date(body.dob),
        email: body.email,
        avatar: body.avatar,
        bio: body.bio,
        address: body.address
          ? {
              upsert: {
                create: body.address,
                update: body.address,
              },
            }
          : undefined,
        emergencyContact: body.emergencyContact
          ? {
              upsert: {
                create: body.emergencyContact,
                update: body.emergencyContact,
              },
            }
          : undefined,
        medicalInfo: body.medicalInfo
          ? {
              upsert: {
                create: body.medicalInfo,
                update: body.medicalInfo,
              },
            }
          : undefined,
        preferences: body.preferences
          ? {
              upsert: {
                create: body.preferences,
                update: body.preferences,
              },
            }
          : undefined,
        stats: body.stats
          ? {
              upsert: {
                create: body.stats,
                update: body.stats,
              },
            }
          : undefined,
      },
      include: {
        address: true,
        emergencyContact: true,
        medicalInfo: true,
        preferences: true,
        stats: true,
      },
    });

    return NextResponse.json({ patient: updatedPatient });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
