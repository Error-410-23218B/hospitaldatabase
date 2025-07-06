import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch appointments scheduled for today with patient email
    const appointments = await prisma.appointment.findMany({
      where: {
        datetime: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: 'Scheduled',
      },
      include: {
        patient: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    // Send email reminders
    for (const appointment of appointments) {
      const to = appointment.patient.email;
      const subject = 'Appointment Reminder';
      const text = `Dear ${appointment.patient.firstName} ${appointment.patient.lastName},

This is a reminder for your appointment scheduled today (${appointment.datetime.toLocaleString()}) with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} for the service: ${appointment.service.name}.

Please make sure to arrive on time.

Thank you,
Hospital Team`;

      try {
        await sendEmail(to, subject, text);
      } catch (error) {
        console.error('Failed to send reminder email to', to, error);
      }
    }

    return NextResponse.json({ message: 'Appointment reminders sent successfully' });
  } catch (error) {
    console.error('Error sending appointment reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
