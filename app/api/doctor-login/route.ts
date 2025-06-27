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

    // Find doctor by email including password field
    const doctor = await prisma.doctor.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        specialization: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if password exists
    if (!doctor.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    console.log("Stored password hash:", doctor.password)
    // Compare password
    const passwordMatch = await bcrypt.compare(password, doctor.password);
    console.log("Password match result:", passwordMatch)

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT token with userType
    const token = jwt.sign({ userType: 'doctor', doctorId: doctor.id, email: doctor.email }, JWT_SECRET, {
      expiresIn: '1h',
    });

    // Set token in HttpOnly cookie
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
    console.error('Doctor login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
