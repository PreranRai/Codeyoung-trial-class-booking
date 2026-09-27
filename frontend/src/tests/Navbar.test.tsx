import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Navbar } from '../components/Navbar';

describe('Navbar Component', () => {
  it('renders branding title and navigation links correctly', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Codeyoung')).toBeInTheDocument();
    expect(screen.getByText('Trial Class Booking')).toBeInTheDocument();
    expect(screen.getByText('Book Trial')).toBeInTheDocument();
    expect(screen.getByText('Admin Demo')).toBeInTheDocument();
  });
});
