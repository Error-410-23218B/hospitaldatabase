import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        dob: true,
        twoFactorEnabled: true,
        smsenabled: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!patient.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, patient.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (patient.twoFactorEnabled || patient.smsenabled) {
      // 2FA is enabled or SMS 2FA is enabled, require 2FA token verification
      const responseJson = { message: '2FA required', twoFactorEnabled: true, patientId: patient.id };
      console.log("Login API 2FA response:", responseJson);
      return NextResponse.json(responseJson);
    }

    const token = jwt.sign({ userType: 'patient', patientId: patient.id, email: patient.email }, JWT_SECRET, {
      expiresIn: '1h',
    });

    const response = NextResponse.json({ message: 'Login successful' });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Patient login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
