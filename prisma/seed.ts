import { PrismaClient, Prisma } from "../app/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const doctors = [
  {
    name: "Dr. Sarah Johnson",
    specialization: "Chief of Cardiology",
    experience: "15+ years",
    education: "Harvard Medical School",
    avatar: "/placeholder.svg?height=100&width=100",
    achievements: ["Board Certified", "Research Publications: 50+", "Awards: 12"],
  },
  {
    name: "Dr. Michael Chen",
    specialization: "Emergency Medicine Director",
    experience: "12+ years",
    education: "Johns Hopkins University",
    avatar: "/placeholder.svg?height=100&width=100",
    achievements: ["Trauma Specialist", "Life Saver Award", "Teaching Excellence"],
  },
  {
    name: "Dr. Emily Rodriguez",
    specialization: "Pediatric Specialist",
    experience: "10+ years",
    education: "Stanford Medical School",
    avatar: "/placeholder.svg?height=100&width=100",
    achievements: ["Child Care Expert", "Community Service Award", "Research Leader"],
  },
  {
    name: "Dr. James Wilson",
    specialization: "Chief Surgeon",
    experience: "20+ years",
    education: "Mayo Clinic College",
    avatar: "/placeholder.svg?height=100&width=100",
    achievements: ["Surgical Innovation", "Patient Safety Award", "Mentor of the Year"],
  },
];

function parseYearsOfExperience(expStr: string): number | null {
  const match = expStr.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  // Remove "Dr. " prefix if present
  const name = fullName.replace(/^Dr\.\s*/, "");
  const parts = name.split(" ");
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

const defaultAvailability = {
  mondayStart: "09:00",
  mondayEnd: "17:00",
  tuesdayStart: "09:00",
  tuesdayEnd: "17:00",
  wednesdayStart: "09:00",
  wednesdayEnd: "17:00",
  thursdayStart: "09:00",
  thursdayEnd: "17:00",
  fridayStart: "09:00",
  fridayEnd: "17:00",
  saturdayStart: "00:00",
  saturdayEnd: "00:00",
  sundayStart: "00:00",
  sundayEnd: "00:00",
  consultationDuration: 30,
  breakDuration: 15,
};

const services = [
  {
    name: "General Consultation",
    description: "Basic health consultation with a general practitioner.",
    duration: 30,
  },
  {
    name: "Cardiology Checkup",
    description: "Comprehensive heart health examination.",
    duration: 45,
  },
  {
    name: "Pediatric Consultation",
    description: "Health consultation for children and adolescents.",
    duration: 30,
  },
  {
    name: "Surgical Consultation",
    description: "Pre-surgery consultation and planning.",
    duration: 60,
  },
];

async function main() {
  const hashedStaffPassword = await bcrypt.hash("staffpassword123", 10);

  // Upsert staff user as before
  await prisma.staff.upsert({
    where: { email: "staff@hospital.com" },
    update: {
      firstName: "Charles",
      lastName: "Johnson",
      password: hashedStaffPassword,
    },
    create: {
      firstName: "Charles",
      lastName: "Johnson",
      email: "smith@hospital.com",
      password: hashedStaffPassword,
    },
  });

  // Seed services
  const serviceRecords = [];
  for (const service of services) {
    const serviceRecord = await prisma.service.upsert({
      where: { id: service.id ?? 0 }, // Use id if available, else 0 to force create
      update: {
        description: service.description,
        duration: service.duration,
      },
      create: {
        name: service.name,
        description: service.description,
        duration: service.duration,
      },
    });
    serviceRecords.push(serviceRecord);
  }

  // Hash password for doctors
  const doctorPassword = await bcrypt.hash("doctorpassword123", 10);

  for (const doc of doctors) {
    const { firstName, lastName } = splitName(doc.name);
    const yearsOfExperience = parseYearsOfExperience(doc.experience);

    // Generate dummy email
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, "")}@hospital.com`;

    // Upsert doctor
    const doctor = await prisma.doctor.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        specialization: doc.specialization,
        yearsOfExperience,
        education: doc.education,
        avatar: doc.avatar,
        certifications: doc.achievements,
        password: doctorPassword,
      },
      create: {
        firstName,
        lastName,
        email,
        specialization: doc.specialization,
        yearsOfExperience,
        education: doc.education,
        avatar: doc.avatar,
        certifications: doc.achievements,
        password: doctorPassword,
      },
    });

    // Upsert doctor availability linked to this doctor
    // First check if doctor already has availability
    if (doctor.availabilityId) {
      await prisma.doctorAvailability.update({
        where: { id: doctor.availabilityId },
        data: {
          ...defaultAvailability,
        },
      });
    } else {
      const availability = await prisma.doctorAvailability.create({
        data: {
          ...defaultAvailability,
          doctor: { connect: { id: doctor.id } },
        },
      });
      // Update doctor with availabilityId
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: { availabilityId: availability.id },
      });
    }

    // Link doctor to services (assign all services to each doctor for demo)
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        services: {
          connect: serviceRecords.map((service) => ({ id: service.id })),
        },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
