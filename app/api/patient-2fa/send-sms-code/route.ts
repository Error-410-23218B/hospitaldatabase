import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || '';

if (!accountSid || !authToken || !verifyServiceSid) {
  console.warn('Twilio credentials or Verify Service SID are not fully set in environment variables.');
}

const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId, 10) },
      select: { phone: true },
    });

    if (!patient || !patient.phone) {
      return NextResponse.json({ error: 'Patient phone number not found' }, { status: 404 });
    }

    // Use Twilio Verify Service to send verification code
    await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({ to: patient.phone, channel: 'sms' });

    return NextResponse.json({ message: 'Verification code sent via SMS' });
  } catch (error) {
    console.error('Error sending SMS verification code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Remove old verifySmsCode function as Twilio Verify handles verification
