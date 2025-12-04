-- CreateTable ProfileDesign
CREATE TABLE "ProfileDesign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL DEFAULT 'classic',
    "themeId" TEXT NOT NULL DEFAULT 'jastip',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileDesign_userId_key" ON "ProfileDesign"("userId");

-- AddForeignKey
ALTER TABLE "ProfileDesign" ADD CONSTRAINT "ProfileDesign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
