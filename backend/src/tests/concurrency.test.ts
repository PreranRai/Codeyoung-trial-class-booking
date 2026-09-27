import { describe, it, expect, beforeEach } from 'vitest';
import { BookingService } from '../services/bookingService';
import { MentorAllocationService } from '../services/mentorAllocationService';
import {
  InMemoryMentorRepository,
  InMemoryParentRepository,
  InMemoryBookingRepository,
  MockEmailService,
  MockPrismaClient,
} from './mocks';

describe('Simultaneous Concurrency & Overlap Audit', () => {
  let mentorRepo: InMemoryMentorRepository;
  let parentRepo: InMemoryParentRepository;
  let bookingRepo: InMemoryBookingRepository;
  let emailService: MockEmailService;
  let allocationService: MentorAllocationService;
  let bookingService: BookingService;
  let mockPrisma: any;

  beforeEach(() => {
    mentorRepo = new InMemoryMentorRepository();
    parentRepo = new InMemoryParentRepository();
    bookingRepo = new InMemoryBookingRepository();
    emailService = new MockEmailService();
    allocationService = new MentorAllocationService(mentorRepo, bookingRepo);
    mockPrisma = new MockPrismaClient();

    bookingService = new BookingService(
      mockPrisma,
      parentRepo,
      bookingRepo,
      allocationService,
      emailService
    );

    // Setup 2 mentors with dailyLimit = 2
    mentorRepo.mentors = [
      { id: 'm1', name: 'Mentor 1', email: 'm1@demo.com', timezone: 'Asia/Kolkata', dailyLimit: 2, active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'm2', name: 'Mentor 2', email: 'm2@demo.com', timezone: 'Asia/Kolkata', dailyLimit: 2, active: true, createdAt: new Date(), updatedAt: new Date() },
    ];
  });

  it('should handle simultaneous parallel booking requests without exceeding capacity or double-booking', async () => {
    const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    futureTime.setUTCHours(13, 30, 0, 0);

    // Launch 3 simultaneous booking attempts for a slot where only 2 mentors are available
    const requests = [
      bookingService.createBooking({ parentName: 'P1', parentEmail: 'p1@demo.com', timezone: 'America/New_York', startTimeUtc: futureTime.toISOString() }),
      bookingService.createBooking({ parentName: 'P2', parentEmail: 'p2@demo.com', timezone: 'Europe/London', startTimeUtc: futureTime.toISOString() }),
      bookingService.createBooking({ parentName: 'P3', parentEmail: 'p3@demo.com', timezone: 'Asia/Kolkata', startTimeUtc: futureTime.toISOString() }),
    ];

    const results = await Promise.allSettled(requests);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Only 2 bookings can succeed because there are 2 mentors
    expect(fulfilled.length).toBe(2);
    expect(rejected.length).toBe(1);

    // Check that rejecting error is SLOT_UNAVAILABLE ConflictError (409)
    const err: any = (rejected[0] as PromiseRejectedResult).reason;
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('SLOT_UNAVAILABLE');
  });

  it('should differentiate between overlapping slots and adjacent non-overlapping slots', async () => {
    const slot1Start = new Date('2026-10-03T05:00:00Z'); // 10:30 AM IST
    const slot1End = new Date('2026-10-03T06:00:00Z');   // 11:30 AM IST

    // Booking 1: 10:30 to 11:30 IST for m1
    await bookingRepo.createBooking({
      parentId: 'p1',
      mentorId: 'm1',
      startTimeUtc: slot1Start,
      endTimeUtc: slot1End,
      meetingLink: 'link',
    });

    // Test A: 11:00 to 12:00 IST (Partial Overlap with Slot 1)
    const overlapStart = new Date('2026-10-03T05:30:00Z');
    const overlapEnd = new Date('2026-10-03T06:30:00Z');
    const conflict = await bookingRepo.findConflictingBooking('m1', overlapStart, overlapEnd);
    expect(conflict).not.toBeNull();

    // Test B: 11:30 to 12:30 IST (Adjacent Slot - Should NOT overlap)
    const adjacentStart = new Date('2026-10-03T06:00:00Z');
    const adjacentEnd = new Date('2026-10-03T07:00:00Z');
    const noConflict = await bookingRepo.findConflictingBooking('m1', adjacentStart, adjacentEnd);
    expect(noConflict).toBeNull();
  });
});
