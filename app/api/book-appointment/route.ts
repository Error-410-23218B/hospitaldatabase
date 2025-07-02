import { NextRequest, NextResponse } from "next/server"
import { bookAppointment } from "@/lib/patient-appointment-actions"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await bookAppointment(data, request)
    if (result.success) {
      return NextResponse.json({ message: result.message })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error("Error booking appointment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
