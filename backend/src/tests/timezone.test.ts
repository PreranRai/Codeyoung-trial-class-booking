import { describe, it, expect } from 'vitest';
import { TimezoneUtils } from '../utils/timezone';

describe('Timezone & DST Utilities', () => {
  it('should validate IANA timezones correctly', () => {
    expect(TimezoneUtils.isValidTimezone('America/New_York')).toBe(true);
    expect(TimezoneUtils.isValidTimezone('Europe/London')).toBe(true);
    expect(TimezoneUtils.isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(TimezoneUtils.isValidTimezone('Invalid/Timezone')).toBe(false);
    expect(TimezoneUtils.isValidTimezone('')).toBe(false);
  });

  it('should correctly handle US Daylight Saving Time (EDT vs EST)', () => {
    // Summer date: July 15 (EDT = UTC-4)
    const summerUtc = new Date('2026-07-15T14:00:00Z');
    const summerAbbr = TimezoneUtils.getTimezoneAbbr(summerUtc, 'America/New_York');
    const summerLocal = TimezoneUtils.formatTimeOnly(summerUtc, 'America/New_York');
    expect(summerAbbr).toBe('EDT');
    expect(summerLocal).toBe('10:00 AM'); // 14:00 UTC - 4h = 10:00 AM EDT

    // Winter date: December 15 (EST = UTC-5)
    const winterUtc = new Date('2026-12-15T14:00:00Z');
    const winterAbbr = TimezoneUtils.getTimezoneAbbr(winterUtc, 'America/New_York');
    const winterLocal = TimezoneUtils.formatTimeOnly(winterUtc, 'America/New_York');
    expect(winterAbbr).toBe('EST');
    expect(winterLocal).toBe('9:00 AM'); // 14:00 UTC - 5h = 9:00 AM EST
  });

  it('should correctly handle UK Daylight Saving Time (BST vs GMT)', () => {
    // Summer date: July 15 (BST = UTC+1)
    const summerUtc = new Date('2026-07-15T14:00:00Z');
    const summerAbbr = TimezoneUtils.getTimezoneAbbr(summerUtc, 'Europe/London');
    const summerLocal = TimezoneUtils.formatTimeOnly(summerUtc, 'Europe/London');
    expect(['BST', 'GMT+1']).toContain(summerAbbr);
    expect(summerLocal).toBe('3:00 PM'); // 14:00 UTC + 1h = 15:00 BST

    // Winter date: December 15 (GMT = UTC+0)
    const winterUtc = new Date('2026-12-15T14:00:00Z');
    const winterAbbr = TimezoneUtils.getTimezoneAbbr(winterUtc, 'Europe/London');
    const winterLocal = TimezoneUtils.formatTimeOnly(winterUtc, 'Europe/London');
    expect(['GMT', 'GMT+0', 'GMT+00:00']).toContain(winterAbbr);
    expect(winterLocal).toBe('2:00 PM'); // 14:00 UTC + 0h = 14:00 GMT
  });

  it('should correctly convert to India Standard Time (IST)', () => {
    const utcDate = new Date('2026-10-03T13:30:00Z');
    const istTime = TimezoneUtils.formatTimeOnly(utcDate, 'Asia/Kolkata');
    const istAbbr = TimezoneUtils.getTimezoneAbbr(utcDate, 'Asia/Kolkata');

    expect(['IST', 'GMT+5:30']).toContain(istAbbr);
    expect(istTime).toBe('7:00 PM'); // 13:30 UTC + 5:30 = 19:00 (7:00 PM IST)
  });

  it('should correctly identify mentor local day boundary crossing', () => {
    // 19:00 UTC on Oct 3 is 00:30 AM IST on Oct 4 in Asia/Kolkata
    const utcDate = new Date('2026-10-03T19:00:00Z');
    const { localDateStr } = TimezoneUtils.getMentorLocalDayRangeUtc(utcDate, 'Asia/Kolkata');

    expect(localDateStr).toBe('2026-10-04');
  });

  it('should verify mentor working hours check (10:00 to 22:00 IST)', () => {
    const mentorTz = 'Asia/Kolkata';
    const workingHours = { startHour: 10, endHour: 22 };

    // 04:30 UTC = 10:00 AM IST (Valid start)
    const validStartUtc = new Date('2026-10-03T04:30:00Z');
    expect(TimezoneUtils.isWithinWorkingHours(validStartUtc, 60, mentorTz, workingHours)).toBe(true);

    // 03:30 UTC = 09:00 AM IST (Before 10 AM IST working hours)
    const earlyStartUtc = new Date('2026-10-03T03:30:00Z');
    expect(TimezoneUtils.isWithinWorkingHours(earlyStartUtc, 60, mentorTz, workingHours)).toBe(false);

    // 16:30 UTC = 22:00 PM IST (End of 60m class exceeds 22:00 IST)
    const lateStartUtc = new Date('2026-10-03T16:30:00Z');
    expect(TimezoneUtils.isWithinWorkingHours(lateStartUtc, 60, mentorTz, workingHours)).toBe(false);
  });
});
