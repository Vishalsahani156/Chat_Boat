import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

export async function connectDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not configured");
  }

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database connection error";
    console.error(
      "Failed to connect to database. Verify DATABASE_URL is correct and the database is reachable.",
      message
    );
    throw error;
  }
}

export default prisma;
