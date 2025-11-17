/*
  Warnings:

  - You are about to drop the column `instagram` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "instagram",
DROP COLUMN "whatsapp";

-- CreateTable
CREATE TABLE "SocialMedia" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialMedia_userId_idx" ON "SocialMedia"("userId");

-- CreateIndex
CREATE INDEX "SocialMedia_platform_idx" ON "SocialMedia"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMedia_userId_platform_key" ON "SocialMedia"("userId", "platform");

-- AddForeignKey
ALTER TABLE "SocialMedia" ADD CONSTRAINT "SocialMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
