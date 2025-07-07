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

    const decoded = jwt.verify(token, JWT_SECRET) as { doctorId?: number, userType?: string };

    if (decoded.userType !== "doctor" || !decoded.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch test results for the authenticated doctor, including doctor info
    const testResults = await prisma.testResult.findMany({
      where: {
        doctorId: decoded.doctorId,
      },
      include: {
        parameters: true,
        patient: true,
        doctor: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({ testResults });
  } catch (error) {
    console.error("Error fetching test results:", error);
    return NextResponse.json({ error: "Failed to fetch test results" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      patientId,
      testName,
      orderDate,
      collectionDate,
      collectionTime,
      priority,
      department,
      clinicalInfo,
      doctorNotes,
      recommendations,
      followUpRequired,
      testResults,
    } = body;

    if (!patientId || !testName || !testResults || !Array.isArray(testResults) || testResults.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Convert patientId to integer if it's a string
    const patientIdInt = typeof patientId === "string" ? parseInt(patientId, 10) : patientId;

    if (isNaN(patientIdInt)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    }

    // Create TestResult record
    const newTestResult = await prisma.testResult.create({
      data: {
        patientId: patientIdInt,
        testName,
        date: new Date(orderDate),
        time: collectionTime,
        doctorId: decoded.doctorId,
        department: department || "Laboratory",
        status: "completed",
        priority,
        notes: doctorNotes,
        // downloadUrl can be null or generated later
        parameters: {
          create: testResults.map((param: any) => ({
            parameter: param.parameter,
            value: param.value,
            unit: param.unit,
            range: param.range,
            status: param.status,
          })),
        },
      },
    });

    return NextResponse.json({ message: "Test result created successfully", testResult: newTestResult });
  } catch (error) {
    console.error("Error creating test result:", error);
    return NextResponse.json({ error: "Failed to create test result" }, { status: 500 });
  }
}

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
      status,
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
