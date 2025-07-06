import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function POST(request: NextRequest) {
  try {
    const { patientId, token } = await request.json();

    if (!patientId || !token) {
      return NextResponse.json({ error: 'Missing patientId or token' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId, 10) },
      select: {
        id: true,
        email: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (
      !patient ||
      !patient.twoFactorEnabled ||
      typeof patient.twoFactorSecret !== 'string' ||
      patient.twoFactorSecret.trim() === ''
    ) {
      return NextResponse.json({ error: '2FA not enabled for this patient' }, { status: 400 });
    }

    const verified = speakeasy.totp.verify({
      secret: patient.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1,
    });

    if (!verified) {
      return NextResponse.json({ error: 'Invalid 2FA token' }, { status: 400 });
    }

    const jwtToken = jwt.sign({ userType: 'patient', patientId: patient.id, email: patient.email }, JWT_SECRET, {
      expiresIn: '1h',
    });

    const response = NextResponse.json({ message: 'Login successful' });
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
