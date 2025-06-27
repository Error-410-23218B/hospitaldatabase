import { PrismaClient, Prisma } from "../app/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedDoctorPassword = await bcrypt.hash("doctorpassword123", 10);

  const doc = await prisma.doctor.upsert({
    where: { email: "smith@hospital.com" },
    update: {
      firstName: "Dr.",
      lastName: "Smith",
      specialization: "Cardiology",
      password: hashedDoctorPassword,
    },
    create: {
      firstName: "John",
      lastName: "Smith",
      specialization: "Cardiology",
      email: "smith@hospital.com",
      password: hashedDoctorPassword,
    },
  });

  const hashedPatientPassword = await bcrypt.hash("testing123", 10);

  const pat = await prisma.patient.upsert({
    where: { email: "jane@doe.com" },
    update: {
      firstName: "Jane",
      lastName: "Doe",
      dob: new Date("2000-01-01"),
      password: hashedPatientPassword,
      address: {
        upsert: {
          update: {
            street: "123 Main St",
            city: "CityName",
            county: "CountyName",
            postcode: "12345",
            country: "CountryName",
          },
          create: {
            street: "123 Main St",
            city: "CityName",
            county: "CountyName",
            postcode: "12345",
            country: "CountryName",
          },
        },
      },
    },
    create: {
      firstName: "Jane",
      lastName: "Doe",
      dob: new Date("2000-01-01"),
      email: "jane@doe.com",
      password: hashedPatientPassword,
      address: {
        create: {
          street: "123 Main St",
          city: "CityName",
          county: "CountyName",
          postcode: "12345",
          country: "CountryName",
        },
      },
    },
  });

  const svc = await prisma.service.upsert({
    where: { id: 1 },
    update: {
      description: "Basic ECG and consultation",
    },
    create: {
      name: "Heart Checkup",
      description: "Basic ECG and consultation",
    },
  });

  await prisma.appointment.upsert({
    where: { id: 1 },
    update: {
      status: "Scheduled",
    },
    create: {
      datetime: new Date(),
      doctorId: doc.id,
      patientId: pat.id,
      serviceId: svc.id,
      status: "Scheduled",
    },
  });
}

main();
