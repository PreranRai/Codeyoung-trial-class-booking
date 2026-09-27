import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { BookingPage } from '../pages/BookingPage';

// Mock API client fetchTimezones method
vi.mock('../api/client', () => ({
  fetchTimezones: vi.fn().mockResolvedValue([
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)', region: 'US' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', region: 'Asia' },
  ]),
  fetchSlots: vi.fn().mockResolvedValue([]),
  createBooking: vi.fn(),
}));

describe('BookingPage Component', () => {
  it('renders trial class booking heading and parent form inputs', async () => {
    render(
      <BrowserRouter>
        <BookingPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Book a Trial Class for Your Child')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. John Smith')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Select Trial Time Slot')).toBeInTheDocument();
  });
});
