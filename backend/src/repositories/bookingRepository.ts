import { PrismaClient, Booking, Parent, Mentor } from '@prisma/client';

export interface IBookingRepository {
  countMentorBookingsInDateRange(
    mentorId: string,
    startUtc: Date,
    endUtc: Date,
    tx?: any
  ): Promise<number>;
  findConflictingBooking(
    mentorId: string,
    startTimeUtc: Date,
    endTimeUtc: Date,
    tx?: any
  ): Promise<Booking | null>;
  createBooking(
    data: {
      id?: string;
      parentId: string;
      mentorId: string;
      startTimeUtc: Date;
      endTimeUtc: Date;
      meetingLink: string;
    },
    tx?: any
  ): Promise<Booking>;
  findBookingsInDateRange(startUtc: Date, endUtc: Date): Promise<Booking[]>;
  findById(id: string): Promise<(Booking & { parent: Parent; mentor: Mentor }) | null>;
  findAllWithDetails(): Promise<any[]>;
}

export class PrismaBookingRepository implements IBookingRepository {
  constructor(private prisma: PrismaClient) {}

  async countMentorBookingsInDateRange(
    mentorId: string,
    startUtc: Date,
    endUtc: Date,
    tx?: any
  ): Promise<number> {
    const db = tx || this.prisma;
    return db.booking.count({
      where: {
        mentorId,
        status: 'CONFIRMED',
        startTimeUtc: {
          gte: startUtc,
          lte: endUtc,
        },
      },
    });
  }

  async findConflictingBooking(
    mentorId: string,
    startTimeUtc: Date,
    endTimeUtc: Date,
    tx?: any
  ): Promise<Booking | null> {
    const db = tx || this.prisma;
    return db.booking.findFirst({
      where: {
        mentorId,
        status: 'CONFIRMED',
        AND: [
          { startTimeUtc: { lt: endTimeUtc } },
          { endTimeUtc: { gt: startTimeUtc } },
        ],
      },
    });
  }

  async createBooking(
    data: {
      id?: string;
      parentId: string;
      mentorId: string;
      startTimeUtc: Date;
      endTimeUtc: Date;
      meetingLink: string;
    },
    tx?: any
  ): Promise<Booking> {
    const db = tx || this.prisma;
    return db.booking.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        parentId: data.parentId,
        mentorId: data.mentorId,
        startTimeUtc: data.startTimeUtc,
        endTimeUtc: data.endTimeUtc,
        meetingLink: data.meetingLink,
        status: 'CONFIRMED',
      },
    });
  }

  async findBookingsInDateRange(startUtc: Date, endUtc: Date): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        startTimeUtc: {
          gte: startUtc,
          lte: endUtc,
        },
      },
      include: {
        parent: true,
        mentor: true,
      },
      orderBy: { startTimeUtc: 'asc' },
    });
  }

  async findById(id: string): Promise<(Booking & { parent: Parent; mentor: Mentor }) | null> {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        parent: true,
        mentor: true,
      },
    }) as Promise<(Booking & { parent: Parent; mentor: Mentor }) | null>;
  }

  async findAllWithDetails(): Promise<any[]> {
    return this.prisma.booking.findMany({
      include: {
        parent: true,
        mentor: true,
      },
      orderBy: { startTimeUtc: 'desc' },
    });
  }
}
