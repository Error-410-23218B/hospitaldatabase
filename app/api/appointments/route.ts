import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { patientId, doctorId, serviceId, datetime } = await request.json();

    if (!patientId || !doctorId || !serviceId || !datetime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        serviceId: Number(serviceId),
        datetime: new Date(datetime),
        status: 'Scheduled',
      },
    });

    return NextResponse.json({ message: 'Appointment booked successfully', appointmentId: appointment.id });
  } catch (error) {
    console.error('Appointment booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: Number(patientId) },
      include: {
        doctor: true,
        service: true,
      },
      orderBy: {
        datetime: 'asc',
      },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { appointmentId, doctorId, serviceId, datetime, status } = await request.json();

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
