export interface Slot {
  startTimeUtc: string;
  endTimeUtc: string;
  parentLocalStart: string;
  parentLocalEnd: string;
  parentLocalDateFormatted: string;
  parentTimezone: string;
  timezoneAbbr: string;
  available: boolean;
  availableMentorCount: number;
}

export interface BookingResponse {
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

export interface AdminOverviewResponse {
  totalBookingsToday: number;
  mentorStats: Array<{
    id: string;
    name: string;
    email: string;
    timezone: string;
    dailyLimit: number;
    active: boolean;
    bookingsToday: number;
    remainingCapacity: number;
    status: 'Full' | 'Available' | 'Inactive';
  }>;
  recentBookings: Array<{
    id: string;
    parentName: string;
    parentEmail: string;
    parentTimezone: string;
    mentorName: string;
    startTimeUtc: string;
    parentLocalTime: string;
    mentorLocalTime: string;
    meetingLink: string;
    status: string;
  }>;
}

export async function fetchTimezones() {
  const res = await fetch('/api/timezones');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch timezones');
  return data.timezones as Array<{ value: string; label: string; region: string }>;
}

export async function fetchSlots(date: string, timezone: string) {
  const res = await fetch(`/api/slots?date=${date}&timezone=${encodeURIComponent(timezone)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch slots');
  return data.slots as Slot[];
}

export async function createBooking(payload: {
  parentName: string;
  parentEmail: string;
  timezone: string;
  startTimeUtc: string;
}): Promise<BookingResponse> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || 'Booking failed');
    (err as any).code = data.error?.code;
    throw err;
  }
  return data.data;
}

export async function fetchBooking(id: string): Promise<BookingResponse> {
  const res = await fetch(`/api/bookings/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Booking not found');
  return data.data;
}

export async function fetchAdminOverview(): Promise<AdminOverviewResponse> {
  const res = await fetch('/api/admin/overview');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch admin overview');
  return data.data;
}
