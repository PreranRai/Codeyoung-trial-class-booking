import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

import { HealthController } from '../controllers/healthController';
import { TimezoneController } from '../controllers/timezoneController';
import { SlotController } from '../controllers/slotController';
import { BookingController } from '../controllers/bookingController';
import { AdminController } from '../controllers/adminController';

import { PrismaMentorRepository } from '../repositories/mentorRepository';
import { PrismaBookingRepository } from '../repositories/bookingRepository';
import { PrismaParentRepository } from '../repositories/parentRepository';

import { MentorAllocationService } from '../services/mentorAllocationService';
import { SlotService } from '../services/slotService';
import { BookingService } from '../services/bookingService';
import { AdminService } from '../services/adminService';
import { ConsoleEmailService } from '../services/emailService';

export function createRouter(prisma: PrismaClient): Router {
  const router = Router();

  // Instantiate Repositories
  const mentorRepo = new PrismaMentorRepository(prisma);
  const bookingRepo = new PrismaBookingRepository(prisma);
  const parentRepo = new PrismaParentRepository(prisma);

  // Instantiate Services
  const emailService = new ConsoleEmailService();
  const mentorAllocationService = new MentorAllocationService(mentorRepo, bookingRepo);
  const slotService = new SlotService(mentorAllocationService);
  const bookingService = new BookingService(
    prisma,
    parentRepo,
    bookingRepo,
    mentorAllocationService,
    emailService
  );
  const adminService = new AdminService(mentorRepo, bookingRepo);

  // Instantiate Controllers
  const slotController = new SlotController(slotService);
  const bookingController = new BookingController(bookingService);
  const adminController = new AdminController(adminService);

  // Route definitions
  router.get('/health', HealthController.getHealth);
  router.get('/timezones', TimezoneController.getTimezones);
  router.get('/slots', slotController.getSlots);
  router.post('/bookings', bookingController.createBooking);
  router.get('/bookings/:id', bookingController.getBooking);
  router.get('/admin/overview', adminController.getOverview);

  return router;
}
