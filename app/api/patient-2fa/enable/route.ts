import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import speakeasy from 'speakeasy';

export async function POST(request: NextRequest) {
  try {
    const { patientId, token, secret, smsEnabled } = await request.json();

    if (!patientId || !token || !secret) {
      return NextResponse.json({ error: 'Missing patientId, token, or secret' }, { status: 400 });
    }

    // Verify the token with the secret
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1,
    });

    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Save the secret and enable 2FA for the patient, set smsenabled if smsEnabled is true
    const updateData: any = {
      twoFactorSecret: secret,
      twoFactorEnabled: true,
    };
    if (smsEnabled === true) {
      updateData.smsenabled = true;
    }
    await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
    });

    return NextResponse.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
