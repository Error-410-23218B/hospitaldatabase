import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

const decoded = jwt.verify(token, JWT_SECRET) as { email?: string; id?: number; doctorId?: number; patientId?: number; staffId?: number };

    if (!decoded.email && !decoded.doctorId && !decoded.patientId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

if (decoded.doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: decoded.doctorId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          specialization: true,
          preferences: {
            select: {
              theme: true,
            },
          },
        },
      });

      if (!doctor) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Add name field combining firstName and lastName for frontend display
      const user = {
        ...doctor,
        theme: doctor.preferences?.theme ?? "light",
        name: doctor.firstName ? `${doctor.firstName} ${doctor.lastName ?? ''}`.trim() : undefined,
      };

      return NextResponse.json({ user });
    }

    if (decoded.staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: decoded.staffId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });

      if (!staff) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const user = {
        id: staff.id,
        name: staff.firstName ? `${staff.firstName} ${staff.lastName ?? ''}`.trim() : undefined,
        email: staff.email,
        role: staff.role,
      };

      return NextResponse.json({ user });
    }

if (decoded.email || decoded.patientId) {
      const patient = await prisma.patient.findUnique({
        where: { email: decoded.email },
        include: {
          address: true,
          emergencyContact: true,
          medicalInfo: true,
          preferences: true,
          stats: true,
        },
      });

      if (!patient) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Map dob to dateOfBirth to match frontend naming
      const user = {
        ...patient,
        dateOfBirth: patient.dob.toISOString().split('T')[0], // format as yyyy-mm-dd for input[type=date]
        preferences: {
          notifications: {
            email: patient.preferences?.notificationsEmail ?? true,
            sms: patient.preferences?.notificationsSms ?? false,
            push: patient.preferences?.notificationsPush ?? true,
            reminders: patient.preferences?.notificationsReminders ?? true,
          },
          privacy: {
            profileVisible: patient.preferences?.profileVisible ?? true,
            shareData: patient.preferences?.shareData ?? false,
          },
          language: patient.preferences?.language ?? 'en',
          timezone: patient.preferences?.timezone ?? 'Europe/London',
          theme: (patient.preferences as any)?.theme ?? "light",
        },
        stats: {
          totalAppointments: patient.stats?.totalAppointments ?? 0,
          upcomingAppointments: patient.stats?.upcomingAppointments ?? 0,
          completedAppointments: patient.stats?.completedAppointments ?? 0,
          memberSince: patient.stats?.memberSince.toISOString() ?? null,
        },
        medicalInfo: {
          bloodType: patient.medicalInfo?.bloodType ?? '',
          allergies: patient.medicalInfo?.allergies ?? [],
          conditions: patient.medicalInfo?.conditions ?? [],
          medications: patient.medicalInfo?.medications ?? [],
        },
      };

      return NextResponse.json({ user });
    }

    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
}
