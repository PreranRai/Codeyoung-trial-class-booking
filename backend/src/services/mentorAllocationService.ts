import { Mentor } from '@prisma/client';
import { IMentorRepository } from '../repositories/mentorRepository';
import { IBookingRepository } from '../repositories/bookingRepository';
import { TimezoneUtils } from '../utils/timezone';
import { CONFIG } from '../config';

export interface EligibleMentorCandidate {
  mentor: Mentor;
  dayBookingsCount: number;
}

export class MentorAllocationService {
  constructor(
    private mentorRepo: IMentorRepository,
    private bookingRepo: IBookingRepository
  ) {}

  /**
   * Finds all active mentors who are available for the slot [startTimeUtc, endTimeUtc].
   */
  async findEligibleMentors(
    startTimeUtc: Date,
    endTimeUtc: Date,
    tx?: any
  ): Promise<EligibleMentorCandidate[]> {
    const activeMentors = await this.mentorRepo.findAllActive();
    const durationMinutes = Math.round((endTimeUtc.getTime() - startTimeUtc.getTime()) / (60 * 1000));
    const candidates: EligibleMentorCandidate[] = [];

    for (const mentor of activeMentors) {
      // 1. Check working hours in mentor's local timezone
      const isWorking = TimezoneUtils.isWithinWorkingHours(
        startTimeUtc,
        durationMinutes,
        mentor.timezone,
        CONFIG.MENTOR_WORKING_HOURS
      );
      if (!isWorking) continue;

      // 2. Determine mentor local day range in UTC
      const { startOfDayUtc, endOfDayUtc } = TimezoneUtils.getMentorLocalDayRangeUtc(
        startTimeUtc,
        mentor.timezone
      );

      // 3. Count bookings on mentor-local day
      const dayBookingsCount = await this.bookingRepo.countMentorBookingsInDateRange(
        mentor.id,
        startOfDayUtc,
        endOfDayUtc,
        tx
      );

      if (dayBookingsCount >= mentor.dailyLimit) continue;

      // 4. Check for overlapping booking
      const conflict = await this.bookingRepo.findConflictingBooking(
        mentor.id,
        startTimeUtc,
        endTimeUtc,
        tx
      );

      if (conflict) continue;

      candidates.push({ mentor, dayBookingsCount });
    }

    return candidates;
  }

  /**
   * Selects the best mentor using fair workload distribution:
   * 1. Fewest bookings on mentor-local calendar day.
   * 2. Mentor ID ascending as deterministic tie-breaker.
   */
  async allocateMentor(
    startTimeUtc: Date,
    endTimeUtc: Date,
    tx?: any
  ): Promise<Mentor | null> {
    const eligibleCandidates = await this.findEligibleMentors(startTimeUtc, endTimeUtc, tx);

    if (eligibleCandidates.length === 0) {
      return null;
    }

    eligibleCandidates.sort((a, b) => {
      if (a.dayBookingsCount !== b.dayBookingsCount) {
        return a.dayBookingsCount - b.dayBookingsCount;
      }
      return a.mentor.id.localeCompare(b.mentor.id);
    });

    return eligibleCandidates[0].mentor;
  }
}
