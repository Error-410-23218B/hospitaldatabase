import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import twilio from 'twilio';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || '';

const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    const { patientId, token, method } = await request.json();

    if (!patientId || !token || !method) {
      return NextResponse.json({ error: 'Missing patientId, token, or method' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId, 10) },
      select: {
        id: true,
        email: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        smsenabled: true,
        phone: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    let verified = false;

    if (method === 'authenticator') {
      if (
        !patient.twoFactorEnabled ||
        typeof patient.twoFactorSecret !== 'string' ||
        patient.twoFactorSecret.trim() === ''
      ) {
        return NextResponse.json({ error: 'Authenticator 2FA not enabled for this patient' }, { status: 400 });
      }

      verified = speakeasy.totp.verify({
        secret: patient.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 1,
      });
    } else if (method === 'sms') {
      if (!patient.smsenabled || !patient.phone) {
        return NextResponse.json({ error: 'SMS 2FA not enabled for this patient' }, { status: 400 });
      }

      const verificationCheck = await client.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({ to: patient.phone, code: token });

      verified = verificationCheck.status === 'approved';
    } else {
      return NextResponse.json({ error: 'Invalid 2FA method' }, { status: 400 });
    }

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
    console.error('Unified 2FA verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
