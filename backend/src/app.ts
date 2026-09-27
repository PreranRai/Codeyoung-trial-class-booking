import express, { Express } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { createRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(prisma: PrismaClient): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Mount API router
  app.use('/api', createRouter(prisma));

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
