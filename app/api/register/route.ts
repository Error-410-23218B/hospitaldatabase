import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, dob, email, address, password } = await request.json();

    if (!firstName || !lastName || !dob || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingPatient = await prisma.patient.findUnique({
      where: { email },
    });

    if (existingPatient) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new patient
    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        dob: new Date(dob),
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: 'User registered successfully', patientId: patient.id });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
