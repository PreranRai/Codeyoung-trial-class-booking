import { IMentorRepository } from '../repositories/mentorRepository';
import { IBookingRepository } from '../repositories/bookingRepository';
import { MentorStatsDto } from '../types';
import { TimezoneUtils } from '../utils/timezone';

export class AdminService {
  constructor(
    private mentorRepo: IMentorRepository,
    private bookingRepo: IBookingRepository
  ) {}

  async getAdminOverview() {
    const mentors = await this.mentorRepo.findAllActive();
    const nowUtc = new Date();

    const mentorStats: MentorStatsDto[] = [];
    let totalBookingsToday = 0;

    for (const mentor of mentors) {
      // Calculate bookings on mentor's current local day
      const { startOfDayUtc, endOfDayUtc } = TimezoneUtils.getMentorLocalDayRangeUtc(
        nowUtc,
        mentor.timezone
      );

      const bookingsToday = await this.bookingRepo.countMentorBookingsInDateRange(
        mentor.id,
        startOfDayUtc,
        endOfDayUtc
      );

      totalBookingsToday += bookingsToday;

      const remainingCapacity = Math.max(0, mentor.dailyLimit - bookingsToday);
      let status: 'Full' | 'Available' | 'Inactive' = 'Available';
      if (!mentor.active) {
        status = 'Inactive';
      } else if (remainingCapacity === 0) {
        status = 'Full';
      }

      mentorStats.push({
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        timezone: mentor.timezone,
        dailyLimit: mentor.dailyLimit,
        active: mentor.active,
        bookingsToday,
        remainingCapacity,
        status,
      });
    }

    const allBookings = await this.bookingRepo.findAllWithDetails();

    return {
      totalBookingsToday,
      mentorStats,
      recentBookings: allBookings.map((b) => ({
        id: b.id,
        parentName: b.parent.name,
        parentEmail: b.parent.email,
        parentTimezone: b.parent.timezone,
        mentorName: b.mentor.name,
        startTimeUtc: b.startTimeUtc.toISOString(),
        parentLocalTime: TimezoneUtils.formatFullLocalTime(b.startTimeUtc, b.parent.timezone),
        mentorLocalTime: TimezoneUtils.formatFullLocalTime(b.startTimeUtc, b.mentor.timezone),
        meetingLink: b.meetingLink,
        status: b.status,
      })),
    };
  }
}
