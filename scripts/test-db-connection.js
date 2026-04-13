require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testConnection() {
  console.log("Testing database connection...\n");

  try {
    await prisma.$connect();
    console.log("Connected to database.");

    const result = await prisma.$queryRaw`SELECT version()`;
    console.log("PostgreSQL version:", result[0].version);

    await prisma.$disconnect();
    await pool.end();
    console.log("\nConnection test passed.");
    process.exit(0);
  } catch (error) {
    console.error("Connection failed:", error.message);
    await prisma.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

testConnection();
