export interface MentorDto {
  id: string;
  name: string;
  email: string;
  timezone: string;
  dailyLimit: number;
  active: boolean;
}

export interface ParentDto {
  id: string;
  name: string;
  email: string;
  timezone: string;
}

export interface BookingDto {
  id: string;
  parentId: string;
  mentorId: string;
  startTimeUtc: Date;
  endTimeUtc: Date;
  status: string;
  meetingLink: string;
  createdAt: Date;
  updatedAt: Date;
  parent?: ParentDto;
  mentor?: MentorDto;
}

export interface SlotDto {
  startTimeUtc: string; // ISO 8601 string
  endTimeUtc: string;   // ISO 8601 string
  parentLocalStart: string; // e.g., "9:30 AM"
  parentLocalEnd: string;   // e.g., "10:30 AM"
  parentLocalDateFormatted: string; // e.g., "Saturday, October 3, 2026"
  parentTimezone: string; // e.g., "America/New_York"
  timezoneAbbr: string;  // e.g., "EDT" or "EST"
  available: boolean;
  availableMentorCount: number;
}

export interface CreateBookingInput {
  parentName: string;
  parentEmail: string;
  timezone: string;
  startTimeUtc: string;
}

export interface BookingConfirmationResponse {
  bookingId: string;
  parent: {
    id: string;
    name: string;
    email: string;
    timezone: string;
  };
  mentor: {
    id: string;
    name: string;
    email: string;
    timezone: string;
  };
  startTimeUtc: string;
  endTimeUtc: string;
  parentLocalTime: string;
  mentorLocalTime: string;
  meetingLink: string;
}

export interface MentorStatsDto extends MentorDto {
  bookingsToday: number;
  remainingCapacity: number;
  status: 'Full' | 'Available' | 'Inactive';
}
