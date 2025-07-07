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

    const decoded = jwt.verify(token, JWT_SECRET) as { patientId?: number };

    if (!decoded.patientId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log("Prisma client instance:", prisma);
    console.log("Prisma testResult property:", prisma.testResult);

    // Prisma client uses camelCase model names, so use testResult instead of testResult
    const testResults = await prisma.testResult.findMany({
      where: { patientId: decoded.patientId },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        parameters: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Map results to frontend format
    const results = testResults.map((tr) => ({
      id: tr.id.toString(),
      testName: tr.testName,
      date: tr.date.toISOString().split("T")[0],
      time: tr.time,
      doctor: tr.doctor ? `${tr.doctor.firstName} ${tr.doctor.lastName}` : "",
      department: tr.department,
      status: tr.status,
      priority: tr.priority,
      results: tr.parameters.map((p) => ({
        parameter: p.parameter,
        value: p.value,
        unit: p.unit,
        range: p.range,
        status: p.status,
      })),
      notes: tr.notes,
      downloadUrl: tr.downloadUrl,
    }));

    return NextResponse.json({ testResults: results });
  } catch (error) {
    console.error("Error fetching patient test results:", error);
    return NextResponse.json({ error: "Failed to fetch test results" }, { status: 500 });
  }
}
