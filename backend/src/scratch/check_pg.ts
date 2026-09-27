import { PrismaClient } from '@prisma/client';

const passwords = ['postgres', 'root', 'admin', 'password', '123456', '1234', 'Prerak@123', 'Postgres123'];

async function test() {
  for (const pwd of passwords) {
    const url = `postgresql://postgres:${pwd}@localhost:5432/codeyoung_booking?schema=public`;
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      await prisma.$connect();
      console.log(`SUCCESS with password: ${pwd}`);
      await prisma.$disconnect();
      process.exit(0);
    } catch (e: any) {
      console.log(`Failed with ${pwd}: ${e.message.split('\n')[0]}`);
      await prisma.$disconnect();
    }
  }
}

test();
