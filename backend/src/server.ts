import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { createApp } from './app';
import { CONFIG } from './config';

const prisma = new PrismaClient();
const app = createApp(prisma);

const server = app.listen(CONFIG.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Trial Class Booking Server is running on port ${CONFIG.PORT}`);
  console.log(`🌐 Health check: http://localhost:${CONFIG.PORT}/api/health`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
const shutdown = async () => {
  console.log('Shutting down server gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Prisma disconnected. Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
