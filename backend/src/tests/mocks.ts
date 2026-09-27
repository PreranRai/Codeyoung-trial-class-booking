import { Mentor, Parent, Booking } from '@prisma/client';
import { IMentorRepository } from '../repositories/mentorRepository';
import { IBookingRepository } from '../repositories/bookingRepository';
import { IParentRepository } from '../repositories/parentRepository';
import { EmailService, EmailDetails } from '../services/emailService';

export class MockPrismaClient {
  private lockPromise: Promise<void> = Promise.resolve();

  async $transaction<T>(cb: (tx: any) => Promise<T>, _options?: any): Promise<T> {
    let release: () => void = () => {};
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    const currentLock = this.lockPromise;
    this.lockPromise = currentLock.then(() => nextLock);

    await currentLock;
    try {
      return await cb(this);
    } finally {
      release();
    }
  }
}

export class InMemoryMentorRepository implements IMentorRepository {
  public mentors: Mentor[] = [];

  async findAllActive(): Promise<Mentor[]> {
    return this.mentors.filter((m) => m.active);
  }

  async findById(id: string): Promise<Mentor | null> {
    return this.mentors.find((m) => m.id === id) || null;
  }
}

export class InMemoryParentRepository implements IParentRepository {
  public parents: Parent[] = [];

  async findOrCreate(data: { name: string; email: string; timezone: string }): Promise<Parent> {
    const existing = this.parents.find((p) => p.email === data.email);
    if (existing) {
      existing.name = data.name;
      existing.timezone = data.timezone;
      return existing;
    }
    const newParent: Parent = {
      id: `parent_${Date.now()}_${Math.random()}`,
      name: data.name,
      email: data.email,
      timezone: data.timezone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.parents.push(newParent);
    return newParent;
  }
}

export class InMemoryBookingRepository implements IBookingRepository {
  public bookings: Booking[] = [];

  async countMentorBookingsInDateRange(
    mentorId: string,
    startUtc: Date,
    endUtc: Date
  ): Promise<number> {
    return this.bookings.filter(
      (b) =>
        b.mentorId === mentorId &&
        b.status === 'CONFIRMED' &&
        b.startTimeUtc.getTime() >= startUtc.getTime() &&
        b.startTimeUtc.getTime() <= endUtc.getTime()
    ).length;
  }

  async findConflictingBooking(
    mentorId: string,
    startTimeUtc: Date,
    endTimeUtc: Date
  ): Promise<Booking | null> {
    const conflict = this.bookings.find(
      (b) =>
        b.mentorId === mentorId &&
        b.status === 'CONFIRMED' &&
        b.startTimeUtc.getTime() < endTimeUtc.getTime() &&
        b.endTimeUtc.getTime() > startTimeUtc.getTime()
    );
    return conflict || null;
  }

  async createBooking(data: {
    id?: string;
    parentId: string;
    mentorId: string;
    startTimeUtc: Date;
    endTimeUtc: Date;
    meetingLink: string;
  }): Promise<Booking> {
    const newBooking: Booking = {
      id: data.id || `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      parentId: data.parentId,
      mentorId: data.mentorId,
      startTimeUtc: data.startTimeUtc,
      endTimeUtc: data.endTimeUtc,
      meetingLink: data.meetingLink,
      status: 'CONFIRMED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bookings.push(newBooking);
    return newBooking;
  }

  async findBookingsInDateRange(startUtc: Date, endUtc: Date): Promise<Booking[]> {
    return this.bookings.filter(
      (b) =>
        b.status === 'CONFIRMED' &&
        b.startTimeUtc.getTime() >= startUtc.getTime() &&
        b.startTimeUtc.getTime() <= endUtc.getTime()
    );
  }

  constructor(
    private parentRepo?: InMemoryParentRepository,
    private mentorRepo?: InMemoryMentorRepository
  ) {}

  async findById(id: string): Promise<any | null> {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) return null;
    const parent = this.parentRepo?.parents.find((p) => p.id === booking.parentId) || {
      id: booking.parentId,
      name: 'John Smith',
      email: 'john@example.com',
      timezone: 'America/New_York',
    };
    const mentor = this.mentorRepo?.mentors.find((m) => m.id === booking.mentorId) || {
      id: booking.mentorId,
      name: 'Ananya Sharma',
      email: 'ananya@demo.com',
      timezone: 'Asia/Kolkata',
    };
    return {
      ...booking,
      parent,
      mentor,
    };
  }

  async findAllWithDetails(): Promise<any[]> {
    return this.bookings.map((booking) => {
      const parent = this.parentRepo?.parents.find((p) => p.id === booking.parentId) || {
        id: booking.parentId,
        name: 'John Smith',
        email: 'john@example.com',
        timezone: 'America/New_York',
      };
      const mentor = this.mentorRepo?.mentors.find((m) => m.id === booking.mentorId) || {
        id: booking.mentorId,
        name: 'Ananya Sharma',
        email: 'ananya@demo.com',
        timezone: 'Asia/Kolkata',
      };
      return {
        ...booking,
        parent,
        mentor,
      };
    });
  }
}

export class MockEmailService implements EmailService {
  public sentEmails: EmailDetails[] = [];

  async sendBookingConfirmation(details: EmailDetails): Promise<void> {
    this.sentEmails.push(details);
  }
}
