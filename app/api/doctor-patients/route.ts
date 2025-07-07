import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { doctorId?: number; userType?: string };

    if (decoded.userType !== "doctor" || !decoded.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch patients with basic info
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dob: true,
      },
      orderBy: {
        lastName: "asc",
      },
      take: 100, // limit to 100 patients for performance
    });

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}
