import { PrismaClient, Prisma } from "../app/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedStaffPassword = await bcrypt.hash("staffpassword123", 10);

  const doc = await prisma.staff.upsert({
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
}

main();
