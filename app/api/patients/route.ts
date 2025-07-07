import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() || "";

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
      },
      orderBy: {
        lastName: "asc",
      },
      take: 50,
    });

    // Map patients to include a 'name' and 'age' field for frontend convenience
    const mappedPatients = patients.map((p) => {
      const name = `${p.firstName} ${p.lastName}`;
      const age = p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : null;
      return {
        id: `P${p.id}`,
        name,
        email: p.email,
        dob: p.dob ? new Date(p.dob).toISOString().split("T")[0] : null,
        age,
      };
    });

    return NextResponse.json(mappedPatients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}
