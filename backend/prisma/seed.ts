import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialMentors = [
  { name: 'Ananya Sharma', email: 'ananya.sharma@codeyoung.demo' },
  { name: 'Rajesh Kumar', email: 'rajesh.kumar@codeyoung.demo' },
  { name: 'Priya Patel', email: 'priya.patel@codeyoung.demo' },
  { name: 'Amit Verma', email: 'amit.verma@codeyoung.demo' },
  { name: 'Sneha Reddy', email: 'sneha.reddy@codeyoung.demo' },
  { name: 'Vikram Joshi', email: 'vikram.joshi@codeyoung.demo' },
  { name: 'Neha Gupta', email: 'neha.gupta@codeyoung.demo' },
  { name: 'Rohan Iyer', email: 'rohan.iyer@codeyoung.demo' },
  { name: 'Kavita Nair', email: 'kavita.nair@codeyoung.demo' },
  { name: 'Siddharth Rao', email: 'siddharth.rao@codeyoung.demo' },
];

async function main() {
  console.log('Seeding initial mentors...');

  for (const mentor of initialMentors) {
    await prisma.mentor.upsert({
      where: { email: mentor.email },
      update: {
        name: mentor.name,
        timezone: 'Asia/Kolkata',
        dailyLimit: 2,
        active: true,
      },
      create: {
        name: mentor.name,
        email: mentor.email,
        timezone: 'Asia/Kolkata',
        dailyLimit: 2,
        active: true,
      },
    });
  }

  console.log('Seeding completed successfully: 10 mentors created/updated.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
