import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
  { code: "CANDIDATE", name: "Candidate" },
  { code: "RECRUITER", name: "Recruiter" },
  { code: "ADMIN", name: "Admin" }
] as const;

const attributeCategories = [
  "Personal Information",
  "Certification",
  "Domain Knowledge",
  "Soft Skills",
  "Technical Skills",
  "Language",
  "Education",
  "Other"
] as const;

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role
    });
  }
  await prisma.attributeCategory.createMany({
    data: attributeCategories.map((name) => ({ name })),
    skipDuplicates: true
  });

  console.info("Seed completed: roles and attribute categories are present.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
