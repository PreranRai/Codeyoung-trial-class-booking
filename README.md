# Trial Class Appointment Booking System

A production-grade, full-stack trial-class appointment booking system built for an online education platform. The system handles timezone conversions across global regions (US, UK, India, etc.), accurate Daylight Saving Time (DST) transitions, concurrent double-booking protection using database transactions, and fair mentor allocation.

---

## Key Features

- **Strict UTC Timestamp Storage**: All appointment start/end times are stored in UTC as ISO 8601 strings in the database.
- **IANA Timezone Awareness**: User and mentor timezones are stored as standard IANA timezone identifiers (e.g. `America/New_York`, `Europe/London`, `Asia/Kolkata`). Fixed offsets like `UTC+5:30` are strictly avoided.
- **Robust DST Handling**: Uses Luxon to dynamically resolve Daylight Saving Time offsets (e.g., EDT vs EST, BST vs GMT) based on appointment dates.
- **Mentor-Local Calendar Day Limits**: Enforces a maximum limit of **2 trial classes per mentor per mentor-local calendar day**.
- **Fair Workload Allocation**: Distributes bookings evenly across eligible mentors by picking the mentor with the fewest bookings on their current mentor-local day (with deterministic ID tie-breaking).
- **Transactional Double-Booking Protection**: Uses database transactions (`prisma.$transaction`) to revalidate availability at the moment of booking creation, returning `HTTP 409 (SLOT_UNAVAILABLE)` on concurrent collisions.
- **Abstracted Email Service**: Modular `ConsoleEmailService` that outputs formatted confirmation emails for parents and mentors to the backend console.
- **Polished Parent UX**: Step-by-step booking flow auto-detects browser timezone (`Intl.DateTimeFormat`), displays slots clearly in parent local time, and provides helpful fallback suggestions when fully booked.
- **Interactive Demo Class Portal**: Deterministic meeting links (`/class/:id`) rendering scheduled session info.
- **Admin & Debug Dashboard**: Live capacity monitor displaying mentor daily workload counts (`2/2 Full`, `1/2 Available`), remaining capacity, and booking history log.

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** (Build Tool)
- **Tailwind CSS** (Styling)
- **React Router v6** (Navigation)
- **React Hook Form** + **Zod** (Form Validation)
- **Luxon** (Timezone & Date Parsing)
- **Lucide React** (Icons)

### Backend
- **Node.js** + **TypeScript**
- **Express.js** (REST API)
- **Prisma ORM** (Database Access & Transactions)
- **PostgreSQL** (Relational Database)
- **Luxon** (IANA Timezone Calculations)
- **Zod** (Request Validation)

### Testing & Tooling
- **Vitest** (Test Runner & Assertions)
- **Supertest** (API Integration Testing)
- **Docker Compose** (PostgreSQL Database Container)
- **ESLint** & **Prettier**

---

## Architecture & Directory Structure

The repository follows a monorepo workspace design with clean layered architecture separating routes, controllers, business services, repositories, and utilities.

```
codeyoung-trial-booking/
├── docker-compose.yml         # PostgreSQL Container configuration
├── package.json               # Monorepo root package configuration
├── .env.example               # Environment variables template
├── README.md                  # System Documentation & Technical Guide
├── TRANSCRIPT.md              # AI Development session transcript log
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma schema (Mentor, Parent, Booking models)
│   │   └── seed.ts            # Seed script creating 10 initial mentors in Asia/Kolkata
│   ├── src/
│   │   ├── config/            # Application constants (duration, working hours)
│   │   ├── controllers/       # Express route handlers
│   │   ├── middleware/        # Centralized error handling & validation
│   │   ├── repositories/      # Prisma DB access abstractions
│   │   ├── routes/            # REST API endpoints
│   │   ├── services/          # Core Business logic (MentorAllocation, Slot, Booking, Email)
│   │   ├── tests/             # Comprehensive Vitest test suite
│   │   ├── types/             # TypeScript DTOs and interfaces
│   │   └── utils/             # TimezoneUtils helper functions
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── api/               # API client methods
    │   ├── components/        # Navbar and UI helpers
    │   ├── pages/             # BookingPage, ConfirmationPage, DemoClassPage, AdminPage
    │   ├── App.tsx            # Routes configuration
    │   └── main.tsx           # React entry point
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## Core Domain & Timezone Logic

### 1. UTC Source of Truth
Appointment start times are converted to UTC `JS Date` objects immediately upon request validation. All persistence in PostgreSQL happens in UTC.

### 2. Mentor-Local Calendar Day Calculation
The 2-booking limit per day is calculated against the **mentor's local calendar day**, NOT the UTC day or parent day.
*Example:*
- Appointment UTC: `2026-10-03 19:00:00 UTC`
- Mentor Timezone: `Asia/Kolkata` (IST = UTC + 5:30)
- Mentor Local Time: `2026-10-04 00:30:00 AM IST`
- This booking counts towards **October 4th** for the mentor's daily limit.

### 3. Concurrency & Double-Booking Protection Mechanism
Booking creation executes within a PostgreSQL **SERIALIZABLE** transaction using Prisma's `isolationLevel: Prisma.TransactionIsolationLevel.Serializable`.

1. **Serializable Transaction Isolation**: Under PostgreSQL `SERIALIZABLE` isolation, PostgreSQL monitors read/write dependency locks (SIREAD). If two concurrent HTTP requests attempt to read the same mentor availability state and write overlapping bookings, PostgreSQL automatically aborts the competing transaction with error code `P2034` / `40001` (Serialization Failure).
2. **Automatic Retry Loop**: `BookingService.createBooking` implements a resilient exponential retry loop (up to 3 attempts). When a `P2034` serialization error is detected, the transaction retries.
3. **Re-Evaluation on Retry**: On retry, the transaction re-evaluates `allocateMentor` against fresh committed PostgreSQL state. If the mentor has been claimed by the competing transaction, it allocates the next eligible mentor or throws a clean `HTTP 409 (SLOT_UNAVAILABLE)` if all mentors are at capacity.

---

## API Documentation

### Health Check
- `GET /api/health`: Returns server status and current UTC server timestamp.

### Timezones
- `GET /api/timezones`: Returns list of common IANA timezones grouped by region.

### Available Slots
- `GET /api/slots?date=YYYY-MM-DD&timezone=IANA_STRING`
  - *Query Params*: `date` (e.g. `2026-10-03`), `timezone` (e.g. `America/New_York`)
  - *Response*: List of 60-minute candidate slots with parent local display start/end times, timezone abbreviation (`EDT`/`EST`), and availability status.

### Create Booking
- `POST /api/bookings`
  - *Payload*:
    ```json
    {
      "parentName": "John Smith",
      "parentEmail": "john@example.com",
      "timezone": "America/New_York",
      "startTimeUtc": "2026-10-03T13:30:00Z"
    }
    ```
  - *Response (HTTP 201)* (Example UUID shown; actual UUID will vary):
    ```json
    {
      "success": true,
      "data": {
        "bookingId": "a320e186-3bce-461a-8269-26749c786040",
        "parent": { "id": "parent-id", "name": "John Smith", "email": "john@example.com", "timezone": "America/New_York" },
        "mentor": { "id": "mentor-id", "name": "Ananya Sharma", "email": "ananya@demo.com", "timezone": "Asia/Kolkata" },
        "startTimeUtc": "2026-10-03T13:30:00Z",
        "endTimeUtc": "2026-10-03T14:30:00Z",
        "parentLocalTime": "Saturday, October 3, 2026 at 9:30 AM EDT",
        "mentorLocalTime": "Saturday, October 3, 2026 at 7:00 PM IST",
        "meetingLink": "http://localhost:5173/class/a320e186-3bce-461a-8269-26749c786040"
      }
    }
    ```
  - *Conflict Response (HTTP 409)*:
    ```json
    {
      "success": false,
      "error": {
        "code": "SLOT_UNAVAILABLE",
        "message": "This slot was just booked or is no longer available. Please choose another time."
      }
    }
    ```

### Booking Details
- `GET /api/bookings/:id`: Retrieves confirmation payload for a booking by ID.

### Admin Overview
- `GET /api/admin/overview`: Returns mentor workload metrics, remaining daily capacities, and recent bookings.

---

## Local Setup & Quickstart

### Prerequisites
- **Node.js**: v18+
- **npm**: v9+
- **Docker & Docker Compose** (for PostgreSQL DB)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd codeyoung-trial-booking
```

### Step 2: Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

### Step 3: Start PostgreSQL with Docker Compose
```bash
docker compose up -d
```

### Step 4: Install Dependencies & Run Database Migrations
```bash
# Install monorepo dependencies
npm install

# Run database migrations & seed 10 default mentors
npm run db:migrate
npm run db:seed
```

### Step 5: Start Development Application
```bash
npm run dev
```
- Frontend will open at: `http://localhost:5173`
- Backend REST API will run at: `http://localhost:5000`
- Admin Dashboard available at: `http://localhost:5173/admin`

---

## Running Automated Tests

The repository includes unit and integration tests covering timezone conversions, DST transitions (US EDT/EST, UK BST/GMT, India IST), double-booking concurrency protection, mentor daily limit enforcement, API validation, and React component UI rendering.

To run all automated tests:
```bash
npm test
```

---

## Key Assumptions & Documented Decisions

1. **Trial Class Duration**: Default is **60 minutes**, configured via `CONFIG.BOOKING_DURATION_MINUTES` in `backend/src/config/index.ts`.
2. **Mentor Working Hours**: Mentors work from **10:00 AM to 10:00 PM (10:00 - 22:00)** in their local timezone (`Asia/Kolkata` IST by default). Configured in `CONFIG.MENTOR_WORKING_HOURS`.
3. **Daily Limit Boundary**: Daily limit of 2 bookings is calculated strictly against the mentor's local calendar date (`yyyy-MM-dd` in mentor's IANA timezone).
4. **Console Email Service**: Emails are printed in formatted console ASCII boxes to keep local setup zero-dependency without needing paid email service credentials.
5. **Dummy Meeting Link**: Generated as `${FRONTEND_URL}/class/${bookingId}`, where `bookingId` is the actual database booking UUID. This ensures the class URL resolves directly to the corresponding booking.

---

## Technical Interview Questions & Architectural Explanations

### 1. Why is UTC used for storage?
UTC provides an unambiguous, absolute instant on the global timeline. Storing local times leads to ambiguous data when daylight saving transitions occur (e.g., during fall back when 1:30 AM occurs twice).

### 2. Why store IANA timezone strings instead of fixed offset numbers like UTC+5:30?
Fixed offsets fail when Daylight Saving Time transitions occur. Storing an IANA identifier like `America/New_York` allows time-aware libraries to dynamically calculate the correct offset for any historical or future date.

### 3. How is DST handled automatically?
We use Luxon which queries the system's IANA Olson timezone database. Luxon automatically determines whether EDT (UTC-4) or EST (UTC-5) applies based on the date of the booking.

### 4. How does local parent time become UTC?
The parent selects a local date/time and timezone. `TimezoneUtils.parseLocalToUtc` converts that local ISO datetime in the parent's timezone to a UTC JS Date object.

### 5. How is mentor local time calculated?
Given a UTC timestamp, `TimezoneUtils.toDateTimeInZone(utcDate, mentor.timezone)` converts the UTC instant into the mentor's local time zone.

### 6. How does the 2/day mentor limit work?
For a requested slot instant, the mentor's local date is resolved (e.g. `2026-10-04`). The system calculates the start of day (`00:00:00 IST`) and end of day (`23:59:59 IST`) in UTC and counts the mentor's confirmed bookings falling within that UTC window.

### 7. Why does mentor-local date matter?
A parent in New York booking at 7:00 PM EDT on Oct 3 is booking a session for 4:30 AM IST on Oct 4 in India. Counting this against Oct 3 in UTC or New York would misattribute the mentor's daily workload on their local calendar.

### 8. How does fair mentor allocation work?
Among eligible mentors, the system selects the mentor with the fewest bookings on their current mentor-local day. Ties are broken deterministically by mentor ID ascending.

### 9. How is concurrent double-booking prevented?
Booking creation runs inside a database transaction (`prisma.$transaction`) with `isolationLevel: Prisma.TransactionIsolationLevel.Serializable`. Inside the transaction, mentor availability and slot conflict checks are executed before inserting the booking. If two requests race for the same slot, PostgreSQL serializable isolation detects the conflict, aborts the competing transaction, and the backend retries or returns a `409 SLOT_UNAVAILABLE` error.

### 10. Why is frontend availability not trusted?
The frontend state can become stale if another user books a slot simultaneously. The backend/database is the ultimate authority for state validation.

### 11. Why is email delivery abstracted?
Abstracting `EmailService` decouples business logic from delivery mechanisms, allowing easy swapping between `ConsoleEmailService` for local dev and `SendGridEmailService` or `AWSSMSEmailService` in production.

### 12. Why is the backend architecture layered?
Layering (Routes → Controllers → Services → Repositories → Database) isolates responsibilities, improves testability with mock repositories, and prevents Express HTTP logic from leaking into core domain rules.
