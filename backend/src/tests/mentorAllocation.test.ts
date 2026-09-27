import { describe, it, expect, beforeEach } from 'vitest';
import { MentorAllocationService } from '../services/mentorAllocationService';
import { InMemoryMentorRepository, InMemoryBookingRepository } from './mocks';

describe('Mentor Allocation & Workload Distribution', () => {
  let mentorRepo: InMemoryMentorRepository;
  let bookingRepo: InMemoryBookingRepository;
  let allocationService: MentorAllocationService;

  beforeEach(() => {
    mentorRepo = new InMemoryMentorRepository();
    bookingRepo = new InMemoryBookingRepository();
    allocationService = new MentorAllocationService(mentorRepo, bookingRepo);

    // Setup 3 mentors
    mentorRepo.mentors = [
      { id: 'm1', name: 'Mentor 1', email: 'm1@demo.com', timezone: 'Asia/Kolkata', dailyLimit: 2, active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'm2', name: 'Mentor 2', email: 'm2@demo.com', timezone: 'Asia/Kolkata', dailyLimit: 2, active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'm3', name: 'Mentor 3', email: 'm3@demo.com', timezone: 'Asia/Kolkata', dailyLimit: 2, active: true, createdAt: new Date(), updatedAt: new Date() },
    ];
  });

  it('should fairly allocate mentor with fewest bookings on mentor-local day', async () => {
    const slotStart = new Date('2026-10-03T05:00:00Z'); // 10:30 AM IST
    const slotEnd = new Date('2026-10-03T06:00:00Z');

    // Mentor 1 has 2 bookings (full)
    // Mentor 2 has 1 booking
    // Mentor 3 has 0 bookings
    await bookingRepo.createBooking({ parentId: 'p1', mentorId: 'm1', startTimeUtc: new Date('2026-10-03T07:00:00Z'), endTimeUtc: new Date('2026-10-03T08:00:00Z'), meetingLink: 'link' });
    await bookingRepo.createBooking({ parentId: 'p2', mentorId: 'm1', startTimeUtc: new Date('2026-10-03T09:00:00Z'), endTimeUtc: new Date('2026-10-03T10:00:00Z'), meetingLink: 'link' });
    await bookingRepo.createBooking({ parentId: 'p3', mentorId: 'm2', startTimeUtc: new Date('2026-10-03T07:00:00Z'), endTimeUtc: new Date('2026-10-03T08:00:00Z'), meetingLink: 'link' });

    const allocated = await allocationService.allocateMentor(slotStart, slotEnd);
    expect(allocated).not.toBeNull();
    expect(allocated?.id).toBe('m3'); // Preferred because m3 has 0 bookings
  });

  it('should enforce maximum 2 bookings per mentor-local calendar day limit', async () => {
    const slotStart = new Date('2026-10-03T05:00:00Z'); // Oct 3
    const slotEnd = new Date('2026-10-03T06:00:00Z');

    // Fill m1, m2, m3 to daily limit (2 each)
    for (const mId of ['m1', 'm2', 'm3']) {
      await bookingRepo.createBooking({ parentId: 'p', mentorId: mId, startTimeUtc: new Date('2026-10-03T07:00:00Z'), endTimeUtc: new Date('2026-10-03T08:00:00Z'), meetingLink: 'link' });
      await bookingRepo.createBooking({ parentId: 'p', mentorId: mId, startTimeUtc: new Date('2026-10-03T09:00:00Z'), endTimeUtc: new Date('2026-10-03T10:00:00Z'), meetingLink: 'link' });
    }

    const allocated = await allocationService.allocateMentor(slotStart, slotEnd);
    expect(allocated).toBeNull(); // All mentors full for this mentor-local calendar day
  });

  it('should allow multiple mentors to handle different bookings at the exact same time', async () => {
    const slotStart = new Date('2026-10-03T05:00:00Z');
    const slotEnd = new Date('2026-10-03T06:00:00Z');

    // m1 booked at slotStart
    await bookingRepo.createBooking({ parentId: 'p1', mentorId: 'm1', startTimeUtc: slotStart, endTimeUtc: slotEnd, meetingLink: 'link' });

    // m2 is free at slotStart
    const allocated = await allocationService.allocateMentor(slotStart, slotEnd);
    expect(allocated).not.toBeNull();
    expect(allocated?.id).toBe('m2');
  });
});
