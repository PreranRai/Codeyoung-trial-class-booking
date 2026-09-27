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
import { ConflictError } from '../utils/errors';

describe('BookingService Workflow & Concurrency', () => {
  let mentorRepo: InMemoryMentorRepository;
  let parentRepo: InMemoryParentRepository;
  let bookingRepo: InMemoryBookingRepository;
  let emailService: MockEmailService;
  let allocationService: MentorAllocationService;
  let bookingService: BookingService;
  let mockPrisma: any;

  beforeEach(() => {
    parentRepo = new InMemoryParentRepository();
    mentorRepo = new InMemoryMentorRepository();
    bookingRepo = new InMemoryBookingRepository(parentRepo, mentorRepo);
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

    // Seed 1 active mentor
    mentorRepo.mentors = [
      {
        id: 'm1',
        name: 'Ananya Sharma',
        email: 'ananya@demo.com',
        timezone: 'Asia/Kolkata',
        dailyLimit: 2,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  });

  it('should successfully book an available slot and trigger emails', async () => {
    // 2026-10-03T13:30:00Z = 7:00 PM IST (Within 10am-10pm IST working hours)
    const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // Align to 13:30 UTC tomorrow
    futureTime.setUTCHours(13, 30, 0, 0);

    const input = {
      parentName: 'John Smith',
      parentEmail: 'john@example.com',
      timezone: 'America/New_York',
      startTimeUtc: futureTime.toISOString(),
    };

    const response = await bookingService.createBooking(input);

    expect(response.bookingId).toBeDefined();
    expect(response.parent.name).toBe('John Smith');
    expect(response.mentor.name).toBe('Ananya Sharma');
    expect(response.meetingLink).toBe(`http://localhost:5173/class/${response.bookingId}`);

    // Verify booking can be retrieved via getBookingById using the bookingId from meetingLink
    const retrieved = await bookingService.getBookingById(response.bookingId);
    expect(retrieved.bookingId).toBe(response.bookingId);
    expect(retrieved.meetingLink).toBe(response.meetingLink);

    // Check email notifications sent with exact meeting link
    expect(emailService.sentEmails.length).toBe(1);
    expect(emailService.sentEmails[0].parentEmail).toBe('john@example.com');
    expect(emailService.sentEmails[0].mentorEmail).toBe('ananya@demo.com');
    expect(emailService.sentEmails[0].meetingLink).toBe(response.meetingLink);
  });

  it('should prevent double booking same mentor slot and throw ConflictError (409)', async () => {
    const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    futureTime.setUTCHours(13, 30, 0, 0);

    const input = {
      parentName: 'Parent 1',
      parentEmail: 'p1@example.com',
      timezone: 'America/New_York',
      startTimeUtc: futureTime.toISOString(),
    };

    // First booking succeeds
    await bookingService.createBooking(input);

    // Second booking attempt at exact same time with only 1 mentor available
    const input2 = {
      parentName: 'Parent 2',
      parentEmail: 'p2@example.com',
      timezone: 'Europe/London',
      startTimeUtc: futureTime.toISOString(),
    };

    await expect(bookingService.createBooking(input2)).rejects.toThrow(ConflictError);
  });
});
