-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "summary" TEXT,
    "location" TEXT,
    "avatarImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateAttributeValue" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "stringValue" TEXT,
    "textValue" TEXT,
    "imageUrl" TEXT,
    "numericValue" DECIMAL(18,4),
    "dateValue" DATE,
    "periodStart" DATE,
    "periodEnd" DATE,
    "booleanValue" BOOLEAN,
    "selectedOptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CandidateAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProject" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "role" TEXT,
    "url" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CandidateProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProjectTag" (
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateProjectTag_pkey" PRIMARY KEY ("projectId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE INDEX "CandidateAttributeValue_candidateProfileId_idx" ON "CandidateAttributeValue"("candidateProfileId");

-- CreateIndex
CREATE INDEX "CandidateAttributeValue_attributeId_idx" ON "CandidateAttributeValue"("attributeId");

-- CreateIndex
CREATE INDEX "CandidateAttributeValue_selectedOptionId_idx" ON "CandidateAttributeValue"("selectedOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateAttributeValue_candidateProfileId_attributeId_key" ON "CandidateAttributeValue"("candidateProfileId", "attributeId");

-- CreateIndex
CREATE INDEX "CandidateProject_candidateProfileId_idx" ON "CandidateProject"("candidateProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTag_name_key" ON "ProjectTag"("name");

-- CreateIndex
CREATE INDEX "CandidateProjectTag_tagId_idx" ON "CandidateProjectTag"("tagId");

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateAttributeValue" ADD CONSTRAINT "CandidateAttributeValue_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateAttributeValue" ADD CONSTRAINT "CandidateAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateAttributeValue" ADD CONSTRAINT "CandidateAttributeValue_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "AttributeOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProject" ADD CONSTRAINT "CandidateProject_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProjectTag" ADD CONSTRAINT "CandidateProjectTag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CandidateProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProjectTag" ADD CONSTRAINT "CandidateProjectTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ProjectTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
