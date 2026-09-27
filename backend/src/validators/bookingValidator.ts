import { z } from 'zod';
import { TimezoneUtils } from '../utils/timezone';

export const createBookingSchema = z.object({
  parentName: z.string().trim().min(2, { message: 'Parent name must be at least 2 characters long' }),
  parentEmail: z.string().trim().email({ message: 'Invalid email address' }),
  timezone: z.string().refine((tz) => TimezoneUtils.isValidTimezone(tz), {
    message: 'Invalid IANA timezone identifier',
  }),
  startTimeUtc: z.string().datetime({ message: 'startTimeUtc must be a valid ISO 8601 string' }).refine(
    (utcStr) => {
      const date = new Date(utcStr);
      return date.getTime() > Date.now();
    },
    { message: 'Cannot book a trial class in the past' }
  ),
});

export const getSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' }),
  timezone: z.string().refine((tz) => TimezoneUtils.isValidTimezone(tz), {
    message: 'Invalid IANA timezone identifier',
  }),
});
