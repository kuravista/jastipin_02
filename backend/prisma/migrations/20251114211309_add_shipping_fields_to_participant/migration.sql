-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "cityId" TEXT,
ADD COLUMN     "cityName" TEXT,
ADD COLUMN     "courier" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "provinceId" TEXT,
ADD COLUMN     "provinceName" TEXT,
ADD COLUMN     "shippingCost" INTEGER;
