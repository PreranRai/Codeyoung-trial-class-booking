export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  BOOKING_DURATION_MINUTES: 60,
  // Mentor working hours in mentor's local timezone (e.g., Asia/Kolkata)
  MENTOR_WORKING_HOURS: {
    startHour: 10, // 10:00 AM
    endHour: 22,   // 10:00 PM (22:00)
  },
  // Interval step between generated slots in minutes
  SLOT_INTERVAL_MINUTES: 30,
  DEFAULT_MENTOR_DAILY_LIMIT: 2,
  DEFAULT_MENTOR_TIMEZONE: 'Asia/Kolkata',
};
