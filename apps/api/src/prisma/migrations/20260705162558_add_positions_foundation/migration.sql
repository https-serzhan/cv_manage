-- CreateEnum
CREATE TYPE "PositionAccessMode" AS ENUM ('PUBLIC', 'RESTRICTED');

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "accessMode" "PositionAccessMode" NOT NULL DEFAULT 'PUBLIC',
    "maxProjects" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionAttribute" (
    "positionId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionAttribute_pkey" PRIMARY KEY ("positionId","attributeId")
);

-- CreateTable
CREATE TABLE "PositionProjectTag" (
    "positionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionProjectTag_pkey" PRIMARY KEY ("positionId","tagId")
);

-- CreateTable
CREATE TABLE "PositionCandidateAccess" (
    "positionId" TEXT NOT NULL,
    "candidateUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionCandidateAccess_pkey" PRIMARY KEY ("positionId","candidateUserId")
);

-- CreateIndex
CREATE INDEX "Position_title_idx" ON "Position"("title");

-- CreateIndex
CREATE INDEX "Position_createdById_idx" ON "Position"("createdById");

-- CreateIndex
CREATE INDEX "Position_accessMode_idx" ON "Position"("accessMode");

-- CreateIndex
CREATE INDEX "PositionAttribute_attributeId_idx" ON "PositionAttribute"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "PositionAttribute_positionId_sortOrder_key" ON "PositionAttribute"("positionId", "sortOrder");

-- CreateIndex
CREATE INDEX "PositionProjectTag_tagId_idx" ON "PositionProjectTag"("tagId");

-- CreateIndex
CREATE INDEX "PositionCandidateAccess_candidateUserId_idx" ON "PositionCandidateAccess"("candidateUserId");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionAttribute" ADD CONSTRAINT "PositionAttribute_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionAttribute" ADD CONSTRAINT "PositionAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionProjectTag" ADD CONSTRAINT "PositionProjectTag_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionProjectTag" ADD CONSTRAINT "PositionProjectTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ProjectTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionCandidateAccess" ADD CONSTRAINT "PositionCandidateAccess_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionCandidateAccess" ADD CONSTRAINT "PositionCandidateAccess_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
