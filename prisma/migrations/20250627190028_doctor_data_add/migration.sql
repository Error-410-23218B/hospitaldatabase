/*
  Warnings:

  - You are about to drop the column `contactInfo` on the `Doctor` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contactInfoId]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[availabilityId]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[preferencesId]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[statsId]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "contactInfo",
ADD COLUMN     "availabilityId" INTEGER,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "contactInfoId" INTEGER,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "preferencesId" INTEGER,
ADD COLUMN     "statsId" INTEGER,
ADD COLUMN     "yearsOfExperience" INTEGER;

-- CreateTable
CREATE TABLE "DoctorContactInfo" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "officeAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "DoctorContactInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorAvailability" (
    "id" SERIAL NOT NULL,
    "mondayStart" TEXT NOT NULL,
    "mondayEnd" TEXT NOT NULL,
    "tuesdayStart" TEXT NOT NULL,
    "tuesdayEnd" TEXT NOT NULL,
    "wednesdayStart" TEXT NOT NULL,
    "wednesdayEnd" TEXT NOT NULL,
    "thursdayStart" TEXT NOT NULL,
    "thursdayEnd" TEXT NOT NULL,
    "fridayStart" TEXT NOT NULL,
    "fridayEnd" TEXT NOT NULL,
    "saturdayStart" TEXT NOT NULL,
    "saturdayEnd" TEXT NOT NULL,
    "sundayStart" TEXT NOT NULL,
    "sundayEnd" TEXT NOT NULL,
    "consultationDuration" INTEGER NOT NULL,
    "breakDuration" INTEGER NOT NULL,

    CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorPreferences" (
    "id" SERIAL NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "patientUpdates" BOOLEAN NOT NULL DEFAULT true,
    "systemUpdates" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "theme" TEXT NOT NULL DEFAULT 'light',

    CONSTRAINT "DoctorPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorStats" (
    "id" SERIAL NOT NULL,
    "totalPatients" INTEGER NOT NULL DEFAULT 0,
    "totalAppointments" INTEGER NOT NULL DEFAULT 0,
    "upcomingAppointments" INTEGER NOT NULL DEFAULT 0,
    "completedAppointments" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "joinedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_contactInfoId_key" ON "Doctor"("contactInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_availabilityId_key" ON "Doctor"("availabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_preferencesId_key" ON "Doctor"("preferencesId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_statsId_key" ON "Doctor"("statsId");

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_contactInfoId_fkey" FOREIGN KEY ("contactInfoId") REFERENCES "DoctorContactInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "DoctorAvailability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_preferencesId_fkey" FOREIGN KEY ("preferencesId") REFERENCES "DoctorPreferences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_statsId_fkey" FOREIGN KEY ("statsId") REFERENCES "DoctorStats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
