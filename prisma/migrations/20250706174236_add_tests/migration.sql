-- CreateTable
CREATE TABLE "TestResult" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "testName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "notes" TEXT,
    "downloadUrl" TEXT,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResultParameter" (
    "id" SERIAL NOT NULL,
    "testResultId" INTEGER NOT NULL,
    "parameter" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "TestResultParameter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResultParameter" ADD CONSTRAINT "TestResultParameter_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "TestResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
