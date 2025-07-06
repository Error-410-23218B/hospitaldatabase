import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import twilio from 'twilio';
import jwt from 'jsonwebtoken';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

if (!accountSid || !authToken || !verifyServiceSid) {
  console.warn('Twilio credentials or Verify Service SID are not fully set in environment variables.');
}

const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    const { patientId, code } = await request.json();

    if (!patientId || !code) {
      return NextResponse.json({ error: 'Missing patientId or code' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId, 10) },
      select: { id: true, email: true, phone: true },
    });

    if (!patient || !patient.phone) {
      return NextResponse.json({ error: 'Patient phone number not found' }, { status: 404 });
    }

    // Use Twilio Verify Service to check the verification code
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({ to: patient.phone, code });

    if (verificationCheck.status === 'approved') {
      // Verification successful
      const jwtToken = jwt.sign({ userType: 'patient', patientId: patient.id, email: patient.email }, JWT_SECRET, {
        expiresIn: '1h',
      });

      const response = NextResponse.json({ message: 'Verification successful' });
      response.cookies.set('token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600,
        path: '/',
        sameSite: 'lax',
      });

      return response;
    } else {
      // Verification failed
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying SMS code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
