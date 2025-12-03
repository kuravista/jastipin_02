-- AddColumn: isProfileComplete, onboardingCompletedAt, tutorialStep
ALTER TABLE "User" ADD COLUMN "isProfileComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "tutorialStep" TEXT DEFAULT 'pending';
