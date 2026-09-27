import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import {
  InMemoryMentorRepository,
  InMemoryParentRepository,
  InMemoryBookingRepository,
  MockEmailService,
  MockPrismaClient,
} from './mocks';
import { MentorAllocationService } from '../services/mentorAllocationService';
import { SlotService } from '../services/slotService';
import { BookingService } from '../services/bookingService';
import { AdminService } from '../services/adminService';
import { Router } from 'express';
import { HealthController } from '../controllers/healthController';
import { TimezoneController } from '../controllers/timezoneController';
import { SlotController } from '../controllers/slotController';
import { BookingController } from '../controllers/bookingController';
import { AdminController } from '../controllers/adminController';
import { errorHandler } from '../middleware/errorHandler';
import express from 'express';

describe('Express REST API Endpoints', () => {
  let app: any;
  let mentorRepo: InMemoryMentorRepository;
  let parentRepo: InMemoryParentRepository;
  let bookingRepo: InMemoryBookingRepository;

  beforeEach(() => {
    mentorRepo = new InMemoryMentorRepository();
    parentRepo = new InMemoryParentRepository();
    bookingRepo = new InMemoryBookingRepository();
    const emailService = new MockEmailService();
    const allocationService = new MentorAllocationService(mentorRepo, bookingRepo);
    const slotService = new SlotService(allocationService);
    const mockPrisma = new MockPrismaClient();
    const bookingService = new BookingService(mockPrisma, parentRepo, bookingRepo, allocationService, emailService);
    const adminService = new AdminService(mentorRepo, bookingRepo);

    mentorRepo.mentors = [
      { id: 'm1', name: 'Mentor 1', email: 'm1@demo.com', timezone: 'Asia/Kolkata', dailyLimit: 2, active: true, createdAt: new Date(), updatedAt: new Date() },
    ];

    const router = Router();
    const slotController = new SlotController(slotService);
    const bookingController = new BookingController(bookingService);
    const adminController = new AdminController(adminService);

    router.get('/health', HealthController.getHealth);
    router.get('/timezones', TimezoneController.getTimezones);
    router.get('/slots', slotController.getSlots);
    router.post('/bookings', bookingController.createBooking);
    router.get('/bookings/:id', bookingController.getBooking);
    router.get('/admin/overview', adminController.getOverview);

    app = express();
    app.use(express.json());
    app.use('/api', router);
    app.use(errorHandler);
  });

  it('GET /api/health should return status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('GET /api/timezones should return list of valid timezones', async () => {
    const res = await request(app).get('/api/timezones');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.timezones)).toBe(true);
    expect(res.body.timezones.some((t: any) => t.value === 'America/New_York')).toBe(true);
  });

  it('POST /api/bookings should reject invalid email address', async () => {
    const res = await request(app).post('/api/bookings').send({
      parentName: 'John',
      parentEmail: 'invalid-email',
      timezone: 'America/New_York',
      startTimeUtc: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/bookings should reject past timestamps', async () => {
    const res = await request(app).post('/api/bookings').send({
      parentName: 'John Smith',
      parentEmail: 'john@example.com',
      timezone: 'America/New_York',
      startTimeUtc: '2020-01-01T10:00:00Z',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/bookings should reject invalid IANA timezone', async () => {
    const res = await request(app).post('/api/bookings').send({
      parentName: 'John Smith',
      parentEmail: 'john@example.com',
      timezone: 'UTC+5:30', // Manual offset strings are rejected as invalid IANA!
      startTimeUtc: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
