const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    await prisma.$connect();
    console.log("SUCCESSFULLY CONNECTED!");
  } catch (e) {
    console.error("CONNECTION FAILED:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
