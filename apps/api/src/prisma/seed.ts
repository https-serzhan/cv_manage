import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
  { code: "CANDIDATE", name: "Candidate" },
  { code: "RECRUITER", name: "Recruiter" },
  { code: "ADMIN", name: "Admin" }
] as const;

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role
    });
  }

  console.info("Seed completed: foundation roles are present.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
