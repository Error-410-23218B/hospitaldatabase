import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { patientId, doctorId, serviceId, datetime } = await request.json();

    if (!patientId || !doctorId || !serviceId || !datetime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch doctor's availability
    const doctorAvailability = await prisma.doctorAvailability.findFirst({
      where: { doctorId: Number(doctorId) },
    });

    if (!doctorAvailability) {
      return NextResponse.json({ error: 'Doctor availability not found' }, { status: 404 });
    }

    const appointmentDate = new Date(datetime);
    const dayOfWeek = appointmentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const appointmentTime = appointmentDate.toTimeString().slice(0, 5); // "HH:MM"

    // Helper function to check if time is within range
    function isTimeInRange(start: string, end: string, time: string) {
      return start <= time && time < end;
    }

    // Map dayOfWeek to availability fields
    const dayMap: { [key: number]: { start: string; end: string } } = {
      0: { start: doctorAvailability.sundayStart, end: doctorAvailability.sundayEnd },
      1: { start: doctorAvailability.mondayStart, end: doctorAvailability.mondayEnd },
      2: { start: doctorAvailability.tuesdayStart, end: doctorAvailability.tuesdayEnd },
      3: { start: doctorAvailability.wednesdayStart, end: doctorAvailability.wednesdayEnd },
      4: { start: doctorAvailability.thursdayStart, end: doctorAvailability.thursdayEnd },
      5: { start: doctorAvailability.fridayStart, end: doctorAvailability.fridayEnd },
      6: { start: doctorAvailability.saturdayStart, end: doctorAvailability.saturdayEnd },
    };

    const { start, end } = dayMap[dayOfWeek];

    if (!isTimeInRange(start, end, appointmentTime)) {
      return NextResponse.json({ error: 'Appointment time is outside doctor availability' }, { status: 400 });
    }

    // Additional checks for consultationDuration and breakDuration can be added here if needed

    const appointment = await prisma.appointment.create({
      data: {
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        serviceId: Number(serviceId),
        datetime: appointmentDate,
        status: 'Scheduled',
      },
    });

    return NextResponse.json({ message: 'Appointment booked successfully', appointmentId: appointment.id });
  } catch (error) {
    console.error('Appointment booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { patientId?: number, userType?: string }
    if (decoded.userType !== "patient" || !decoded.patientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const patientId = decoded.patientId

    const appointments = await prisma.appointment.findMany({
      where: { patientId: Number(patientId) },
      include: {
        doctor: true,
        service: true,
      },
      orderBy: [
        { priority: "asc" },
        { datetime: "asc" },
      ],
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if batch update for priorities
    if (Array.isArray(body)) {
      // Expecting array of { id: number, priority: number }
      const updates = body;

      // Use transaction to update all priorities
      await prisma.$transaction(
        updates.map(({ id, priority }) =>
          prisma.appointment.update({
            where: { id: Number(id) },
            data: { priority: Number(priority) },
          })
        )
      );

      return NextResponse.json({ message: 'Appointment priorities updated successfully' });
    }

    // Single appointment update
    const { appointmentId, doctorId, serviceId, datetime, status } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    const updateData: any = {};
    if (doctorId !== undefined) updateData.doctorId = Number(doctorId);
    if (serviceId !== undefined) updateData.serviceId = Number(serviceId);
    if (datetime !== undefined) updateData.datetime = new Date(datetime);
    if (status !== undefined) updateData.status = status;

    const updatedAppointment = await prisma.appointment.update({
      where: { id: Number(appointmentId) },
      data: updateData,
      include: {
        doctor: true,
        service: true,
      },
    });

    return NextResponse.json({ message: 'Appointment updated successfully', appointment: updatedAppointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
