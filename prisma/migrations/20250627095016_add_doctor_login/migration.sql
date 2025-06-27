/*
  Warnings:

  - Made the column `firstName` on table `Doctor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `Doctor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `Doctor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Doctor" ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
ALTER COLUMN "password" SET NOT NULL;
