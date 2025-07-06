import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 });
    }

    // Generate a new 2FA secret
    const secret = speakeasy.generateSecret({ length: 20 });

    // Generate otpauth URL for QR code
    const otpauthUrl = `otpauth://totp/HospitalApp:${patientId}?secret=${secret.base32}&issuer=HospitalApp`;

    // Generate QR code image data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Return secret and QR code image data URL to client
    return NextResponse.json({ secret: secret.base32, qrCodeDataUrl });
  } catch (error) {
    console.error('Error generating 2FA secret:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
