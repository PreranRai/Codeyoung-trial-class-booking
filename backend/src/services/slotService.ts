import { DateTime } from 'luxon';
import { SlotDto } from '../types';
import { TimezoneUtils } from '../utils/timezone';
import { MentorAllocationService } from './mentorAllocationService';
import { CONFIG } from '../config';

export class SlotService {
  constructor(private mentorAllocationService: MentorAllocationService) {}

  /**
   * Generates time slots for a given local date and timezone.
   */
  async getAvailableSlots(dateStr: string, parentTimezone: string): Promise<SlotDto[]> {
    if (!TimezoneUtils.isValidTimezone(parentTimezone)) {
      throw new Error(`Invalid IANA timezone: ${parentTimezone}`);
    }

    const slots: SlotDto[] = [];
    const localStartOfDay = DateTime.fromISO(dateStr, { zone: parentTimezone }).startOf('day');

    // Generate slots every 30 minutes for the 24 hours of the parent local day
    // Slot duration is 60 minutes
    const stepMinutes = CONFIG.SLOT_INTERVAL_MINUTES;
    const durationMinutes = CONFIG.BOOKING_DURATION_MINUTES;
    const totalSteps = (24 * 60) / stepMinutes; // 48 slots per day

    for (let i = 0; i < totalSteps; i++) {
      const currentLocalStart = localStartOfDay.plus({ minutes: i * stepMinutes });
      const currentLocalEnd = currentLocalStart.plus({ minutes: durationMinutes });

      // If slot end spills into the next local day beyond 23:59:59, we cap or include if appropriate
      // Check if start of slot is on the requested date
      if (currentLocalStart.toFormat('yyyy-MM-dd') !== dateStr) {
        continue;
      }

      const startTimeUtc = currentLocalStart.toJSDate();
      const endTimeUtc = currentLocalEnd.toJSDate();

      // Skip past slots
      if (startTimeUtc.getTime() <= Date.now()) {
        continue;
      }

      const eligibleCandidates = await this.mentorAllocationService.findEligibleMentors(
        startTimeUtc,
        endTimeUtc
      );

      const isAvailable = eligibleCandidates.length > 0;

      slots.push({
        startTimeUtc: startTimeUtc.toISOString(),
        endTimeUtc: endTimeUtc.toISOString(),
        parentLocalStart: currentLocalStart.toFormat('h:mm a'),
        parentLocalEnd: currentLocalEnd.toFormat('h:mm a'),
        parentLocalDateFormatted: currentLocalStart.toFormat('EEEE, MMMM d, yyyy'),
        parentTimezone,
        timezoneAbbr: currentLocalStart.toFormat('ZZZZ'),
        available: isAvailable,
        availableMentorCount: eligibleCandidates.length,
      });
    }

    return slots;
  }
}
