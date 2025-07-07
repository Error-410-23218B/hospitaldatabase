import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { doctorId?: number, userType?: string };

    if (decoded.userType !== "doctor" || !decoded.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    const {
      testResultId,
      notes,
      followUpRequired,
      status,
      reviewedBy,
      reviewedDate,
      reviewedTime,
    } = body;

    if (!testResultId) {
      return NextResponse.json({ error: "Missing testResultId" }, { status: 400 });
    }

    // Update the test result record
    const updatedTestResult = await prisma.testResult.update({
      where: { id: testResultId },
      data: {
        notes,
        status,
      },
    });

    return NextResponse.json({ message: "Test result updated successfully", testResult: updatedTestResult });
  } catch (error) {
    console.error("Error updating test result:", error);
    return NextResponse.json({ error: "Failed to update test result" }, { status: 500 });
  }
}
