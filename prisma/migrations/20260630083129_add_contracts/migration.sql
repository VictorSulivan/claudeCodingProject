-- CreateEnum
CREATE TYPE "ContractKind" AS ENUM ('EMPLOYE', 'CONTRACTANT');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('BROUILLON', 'ENVOYE', 'ACCEPTE', 'TERMINE', 'ANNULE');

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "kind" "ContractKind" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'BROUILLON',
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "jobTitle" TEXT,
    "contractType" TEXT,
    "serviceDescription" TEXT,
    "deliverables" TEXT,
    "remunerationAmount" DOUBLE PRECISION,
    "remunerationNote" TEXT,
    "notes" TEXT,
    "customFields" JSONB NOT NULL DEFAULT '[]',
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
