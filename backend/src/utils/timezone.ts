import { DateTime, IANAZone } from 'luxon';

export class TimezoneUtils {
  /**
   * Validates if a string is a valid IANA timezone identifier.
   */
  static isValidTimezone(tz: string): boolean {
    if (!tz || typeof tz !== 'string') return false;
    return IANAZone.create(tz).isValid;
  }

  /**
   * Converts an ISO UTC string or Date object to a Luxon DateTime in the specified timezone.
   */
  static toDateTimeInZone(date: Date | string, timezone: string): DateTime {
    const jsDate = typeof date === 'string' ? new Date(date) : date;
    return DateTime.fromJSDate(jsDate, { zone: timezone });
  }

  /**
   * Formats a UTC Date for display in a specific timezone.
   * Example: "Saturday, October 3, 2026 at 9:30 AM EDT"
   */
  static formatFullLocalTime(date: Date | string, timezone: string): string {
    const dt = this.toDateTimeInZone(date, timezone);
    return dt.toFormat("EEEE, MMMM d, yyyy 'at' h:mm a ZZZZ");
  }

  /**
   * Formats a time string, e.g. "9:30 AM"
   */
  static formatTimeOnly(date: Date | string, timezone: string): string {
    const dt = this.toDateTimeInZone(date, timezone);
    return dt.toFormat('h:mm a');
  }

  /**
   * Formats a date string, e.g. "Saturday, October 3, 2026"
   */
  static formatDateOnly(date: Date | string, timezone: string): string {
    const dt = this.toDateTimeInZone(date, timezone);
    return dt.toFormat('EEEE, MMMM d, yyyy');
  }

  /**
   * Returns short timezone abbreviation or identifier (e.g., EDT, EST, IST, GMT, BST).
   */
  static getTimezoneAbbr(date: Date | string, timezone: string): string {
    const dt = this.toDateTimeInZone(date, timezone);
    return dt.toFormat('ZZZZ');
  }

  /**
   * Given a target date string ("YYYY-MM-DD") in a user's timezone,
   * returns the UTC start and end boundaries of that local calendar day.
   */
  static getLocalDayBoundsUtc(dateStr: string, timezone: string): { startUtc: Date; endUtc: Date } {
    const localStart = DateTime.fromISO(dateStr, { zone: timezone }).startOf('day');
    const localEnd = DateTime.fromISO(dateStr, { zone: timezone }).endOf('day');

    return {
      startUtc: localStart.toJSDate(),
      endUtc: localEnd.toJSDate(),
    };
  }

  /**
   * Given a UTC instant and mentor timezone, determines the mentor's local calendar day ("YYYY-MM-DD")
   * and returns the start and end of that mentor-local day in UTC.
   */
  static getMentorLocalDayRangeUtc(date: Date | string, mentorTimezone: string): {
    localDateStr: string;
    startOfDayUtc: Date;
    endOfDayUtc: Date;
  } {
    const dt = this.toDateTimeInZone(date, mentorTimezone);
    const localDateStr = dt.toFormat('yyyy-MM-dd');
    const localStart = dt.startOf('day');
    const localEnd = dt.endOf('day');

    return {
      localDateStr,
      startOfDayUtc: localStart.toJSDate(),
      endOfDayUtc: localEnd.toJSDate(),
    };
  }

  /**
   * Checks if a booking slot (startTimeUtc + duration) falls within mentor local working hours.
   */
  static isWithinWorkingHours(
    startTimeUtc: Date | string,
    durationMinutes: number,
    mentorTimezone: string,
    workingHours: { startHour: number; endHour: number }
  ): boolean {
    const startDt = this.toDateTimeInZone(startTimeUtc, mentorTimezone);
    const jsStart = typeof startTimeUtc === 'string' ? new Date(startTimeUtc) : startTimeUtc;
    const jsEnd = new Date(jsStart.getTime() + durationMinutes * 60 * 1000);
    const endDt = DateTime.fromJSDate(jsEnd, { zone: mentorTimezone });

    // Ensure slot starts and ends on the same mentor local day
    if (startDt.toFormat('yyyy-MM-dd') !== endDt.toFormat('yyyy-MM-dd')) {
      return false;
    }

    const startDecimal = startDt.hour + startDt.minute / 60;
    const endDecimal = endDt.hour + endDt.minute / 60;

    return startDecimal >= workingHours.startHour && endDecimal <= workingHours.endHour;
  }

  /**
   * Parse ISO local date and time string in a timezone to a UTC JS Date.
   */
  static parseLocalToUtc(dateStr: string, timeStr: string, timezone: string): Date {
    // dateStr: "2026-10-03", timeStr: "09:30"
    const combinedISO = `${dateStr}T${timeStr}:00`;
    const dt = DateTime.fromISO(combinedISO, { zone: timezone });
    if (!dt.isValid) {
      throw new Error(`Invalid local date/time: ${combinedISO} in ${timezone}`);
    }
    return dt.toJSDate();
  }
}
