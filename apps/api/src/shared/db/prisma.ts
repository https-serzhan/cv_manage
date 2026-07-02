import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export function disconnectPrisma() {
  return prisma.$disconnect();
}
