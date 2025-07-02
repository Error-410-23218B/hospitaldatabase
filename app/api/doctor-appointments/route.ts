import { NextResponse } from "next/server"
import { getCurrentDoctor } from "@/lib/auth-actions"
import prisma from "@/lib/prisma"

import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const doctor = await getCurrentDoctor(request)
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not authenticated" }, { status: 401 })
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            dob: true,
            avatar: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        datetime: "asc",
      },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching doctor appointments:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}
