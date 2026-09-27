import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { CreateBookingInput, BookingConfirmationResponse } from '../types';
import { IParentRepository } from '../repositories/parentRepository';
import { IBookingRepository } from '../repositories/bookingRepository';
import { MentorAllocationService } from './mentorAllocationService';
import { EmailService } from './emailService';
import { TimezoneUtils } from '../utils/timezone';
import { ConflictError, NotFoundError } from '../utils/errors';
import { CONFIG } from '../config';

export class BookingService {
  constructor(
    private prisma: PrismaClient,
    private parentRepo: IParentRepository,
    private bookingRepo: IBookingRepository,
    private mentorAllocationService: MentorAllocationService,
    private emailService: EmailService
  ) {}

  async createBooking(input: CreateBookingInput): Promise<BookingConfirmationResponse> {
    const startTimeUtc = new Date(input.startTimeUtc);
    const endTimeUtc = new Date(startTimeUtc.getTime() + CONFIG.BOOKING_DURATION_MINUTES * 60 * 1000);

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      try {
        // Execute booking in a SERIALIZABLE PostgreSQL database transaction
        const result = await this.prisma.$transaction(
          async (tx) => {
            // 1. Re-validate mentor availability within transaction lock
            const allocatedMentor = await this.mentorAllocationService.allocateMentor(
              startTimeUtc,
              endTimeUtc,
              tx
            );

            if (!allocatedMentor) {
              throw new ConflictError(
                'This slot was just booked or is no longer available. Please choose another time.',
                'SLOT_UNAVAILABLE'
              );
            }

            // 2. Find or create parent
            const parent = await this.parentRepo.findOrCreate(
              {
                name: input.parentName,
                email: input.parentEmail,
                timezone: input.timezone,
              },
              tx as any
            );

            // 3. Generate deterministic booking UUID and matching meeting link
            const bookingId = crypto.randomUUID();
            const meetingLink = `${CONFIG.FRONTEND_URL}/class/${bookingId}`;

            // 4. Create booking record using the exact bookingId
            const booking = await this.bookingRepo.createBooking(
              {
                id: bookingId,
                parentId: parent.id,
                mentorId: allocatedMentor.id,
                startTimeUtc,
                endTimeUtc,
                meetingLink,
              },
              tx as any
            );

            return { booking, parent, mentor: allocatedMentor };
          },
          {
            // Enforce PostgreSQL SERIALIZABLE transaction isolation level
            isolationLevel: 'Serializable' as any,
          }
        );

        const parentLocalTimeFormatted = TimezoneUtils.formatFullLocalTime(
          result.booking.startTimeUtc,
          result.parent.timezone
        );

        const mentorLocalTimeFormatted = TimezoneUtils.formatFullLocalTime(
          result.booking.startTimeUtc,
          result.mentor.timezone
        );

        // 5. Trigger email notifications asynchronously
        this.emailService.sendBookingConfirmation({
          parentEmail: result.parent.email,
          parentName: result.parent.name,
          parentLocalTimeFormatted,
          mentorEmail: result.mentor.email,
          mentorName: result.mentor.name,
          mentorLocalTimeFormatted,
          meetingLink: result.booking.meetingLink,
          bookingId: result.booking.id,
        }).catch((err) => {
          console.error('Failed to send confirmation email:', err);
        });

        return {
          bookingId: result.booking.id,
          parent: {
            id: result.parent.id,
            name: result.parent.name,
            email: result.parent.email,
            timezone: result.parent.timezone,
          },
          mentor: {
            id: result.mentor.id,
            name: result.mentor.name,
            email: result.mentor.email,
            timezone: result.mentor.timezone,
          },
          startTimeUtc: result.booking.startTimeUtc.toISOString(),
          endTimeUtc: result.booking.endTimeUtc.toISOString(),
          parentLocalTime: parentLocalTimeFormatted,
          mentorLocalTime: mentorLocalTimeFormatted,
          meetingLink: result.booking.meetingLink,
        };
      } catch (err: any) {
        // Detect PostgreSQL Serialization Failures (Prisma P2034 or Postgres 40001)
        const isSerializationFailure =
          err.code === 'P2034' ||
          err.code === '40001' ||
          (err.message && err.message.toLowerCase().includes('serialization failure'));

        if (isSerializationFailure && attempt < maxRetries) {
          console.warn(`PostgreSQL serialization failure (P2034). Retrying transaction (attempt ${attempt}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, attempt * 50));
          continue; // Retry loop
        }

        if (err instanceof ConflictError) {
          throw err;
        }

        if (isSerializationFailure) {
          throw new ConflictError(
            'This slot was just booked by another parent. Please choose another time.',
            'SLOT_UNAVAILABLE'
          );
        }

        throw err;
      }
    }

    throw new ConflictError('This slot is currently unavailable. Please try again.', 'SLOT_UNAVAILABLE');
  }

  async getBookingById(id: string): Promise<BookingConfirmationResponse> {
    const booking = await this.bookingRepo.findById(id);

    if (!booking) {
      throw new NotFoundError(`Booking with ID ${id} not found.`);
    }

    const parentLocalTimeFormatted = TimezoneUtils.formatFullLocalTime(
      booking.startTimeUtc,
      booking.parent.timezone
    );

    const mentorLocalTimeFormatted = TimezoneUtils.formatFullLocalTime(
      booking.startTimeUtc,
      booking.mentor.timezone
    );

    return {
      bookingId: booking.id,
      parent: {
        id: booking.parent.id,
        name: booking.parent.name,
        email: booking.parent.email,
        timezone: booking.parent.timezone,
      },
      mentor: {
        id: booking.mentor.id,
        name: booking.mentor.name,
        email: booking.mentor.email,
        timezone: booking.mentor.timezone,
      },
      startTimeUtc: booking.startTimeUtc.toISOString(),
      endTimeUtc: booking.endTimeUtc.toISOString(),
      parentLocalTime: parentLocalTimeFormatted,
      mentorLocalTime: mentorLocalTimeFormatted,
      meetingLink: booking.meetingLink,
    };
  }
}
