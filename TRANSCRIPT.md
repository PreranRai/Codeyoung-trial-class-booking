# AI-Assisted Development Transcript

## Trial Class Appointment Booking System

**Assignment:** Full Stack Engineer Task – Codeyoung  
**Project:** Trial Class Appointment Booking System  
**AI Assistant:** ChatGPT / AI-assisted development  
**Date:** September 2026

> **Transcript authenticity note:** This document is a reconstructed, readable record of the AI-assisted development sessions used during this project. It preserves the prompts, engineering decisions, implementation discussions, debugging steps, validation activities, and final verification stages that materially influenced the project. It is not presented as a raw platform-exported conversation file. No conversations, implementation work, test results, or technical decisions have been intentionally fabricated.

---

## Session 1 — Understanding the Assignment

### User Prompt

I have an assignment to do for the Full Stack Developer role.

The task is to build a similar appointment-booking system for trial classes.

Requirements:

- 10 mentors available for trial classes.
- 20 parents interested in booking a trial class per day.
- Parents select a comfortable time slot.
- An available mentor is assigned automatically.
- Parent and mentor receive a dummy class link.
- Parents and mentors may be in different time zones.
- Local times must always be displayed and communicated correctly.
- Daylight Saving Time must be handled.
- Mentors can have at most 2 demo classes a day.
- If no mentors are available, an appropriate error state should be shown.
- Backend must use Node.js or Python.
- Frontend must use React.
- Submit the project as a GitHub repository with README.md and TRANSCRIPT.md.

How should I approach this assignment?

### AI Response

The project should be treated as a production-oriented booking system rather than a simple CRUD application.

The core architecture should contain:

- React + TypeScript frontend.
- Node.js + Express + TypeScript backend.
- PostgreSQL database.
- Prisma ORM.
- Timezone-aware date handling using IANA timezone identifiers.
- UTC as the source of truth for appointment timestamps.
- Mentor allocation logic.
- Mentor daily capacity of two classes.
- Transaction-safe booking creation.
- Dummy email service.
- Dummy class links.
- Automated tests.
- README documentation.

The most important engineering challenges are timezone conversion, DST, mentor-local daily limits, and concurrent bookings.

---

## Session 2 — Architecture and Technology Selection

### User Prompt

Give me a strong architecture and technology stack for this assignment. I want the project to be maintainable and easy to explain during a technical interview.

### AI Response

Recommended stack:

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Zod

### Backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Zod

### Timezone

Use Luxon or date-fns with timezone support.

Store appointment timestamps in UTC and store user/mentor timezones using IANA identifiers such as:

- `America/New_York`
- `Europe/London`
- `Asia/Kolkata`

The backend should be layered:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
Prisma
  ↓
PostgreSQL
```

Important services include:

- TimezoneService
- SlotService
- MentorAllocationService
- BookingService
- EmailService

---

## Session 3 — Timezone and DST Design

### User Prompt

How should I handle parents in the US or UK and mentors in India? I also need to handle Daylight Saving Time correctly.

### AI Response

Never store a local appointment time as the source of truth.

Store:

```text
startTimeUtc
endTimeUtc
```

and store the timezone separately.

For example:

```text
Parent timezone:
America/New_York

Mentor timezone:
Asia/Kolkata
```

The parent selects a local time. The application converts it to a UTC instant.

The mentor's displayed time is then calculated from the same UTC instant.

Do not manually add or subtract fixed offsets such as:

```text
UTC + 5:30
UTC - 5
```

because US and UK offsets change during Daylight Saving Time.

Use IANA timezone identifiers with a timezone-aware library such as Luxon.

For example, the same UTC instant may be displayed as:

```text
9:30 AM EDT
```

for a New York parent and:

```text
7:00 PM IST
```

for an Indian mentor.

---

## Session 4 — Mentor Allocation

### User Prompt

How should I implement the 10 mentors and the maximum 2 classes per mentor per day?

### AI Response

Seed 10 mentors into the database.

Each mentor should have:

```text
id
name
email
timezone
dailyLimit
active
```

Set:

```text
timezone = Asia/Kolkata
dailyLimit = 2
```

The mentor daily limit must be calculated using the mentor's local calendar day.

Do not simply use the UTC date.

For example:

```text
UTC:
October 3, 19:00

Asia/Kolkata:
October 4, 00:30
```

That booking belongs to October 4 for the mentor.

For allocation, find eligible mentors and select the mentor with the fewest bookings for the current mentor-local day.

Use mentor ID as a deterministic tie-breaker.

---

## Session 5 — Database and Booking Flow

### User Prompt

Design the database and APIs for the application.

### AI Response

Use PostgreSQL with Prisma.

Main models:

```text
Mentor
Parent
Booking
```

Booking should contain:

```text
id
parentId
mentorId
startTimeUtc
endTimeUtc
status
meetingLink
createdAt
updatedAt
```

Suggested APIs:

```text
GET /api/health

GET /api/timezones

GET /api/slots

POST /api/bookings

GET /api/bookings/:id

GET /api/admin/bookings
```

The frontend should never be treated as authoritative for availability.

The backend must revalidate availability before creating a booking.

---

## Session 6 — Frontend UX

### User Prompt

I want the application to look like a real customer-facing booking product rather than a developer dashboard. What flow should I implement?

### AI Response

Use a simple step-by-step booking flow:

```text
Landing Page
    ↓
Parent Details
    ↓
Timezone
    ↓
Date Selection
    ↓
Available Time Slots
    ↓
Confirmation
    ↓
Demo Class
```

The parent should always see:

> Times shown in your local timezone

The confirmation page should display:

```text
Trial Class Booked

Parent local time:
Saturday, October 3
9:30 AM EDT

Mentor:
Ananya Sharma

Mentor local time:
Saturday, October 3
7:00 PM IST

Join Demo Class
```

If no mentor is available, show a customer-friendly error and suggest alternative dates/times.

---

## Session 7 — Email and Meeting Link

### User Prompt

The assignment says the parent and mentor should receive emails, but I don't want to depend on a paid email provider.

### AI Response

Create an `EmailService` abstraction.

For development, use:

```text
ConsoleEmailService
```

It can print the email to the backend console.

The parent email should include:

- Trial date
- Parent local time
- Parent timezone
- Mentor name
- Meeting link

The mentor email should include:

- Parent name
- Mentor local date/time
- Mentor timezone
- Meeting link

Generate a dummy class URL such as:

```text
http://localhost:5173/class/{bookingId}
```

where `bookingId` is the actual database booking UUID.

Create a simple demo-class page that displays the booking information.

---

## Session 8 — Concurrency and Double Booking

### User Prompt

How do I prevent two parents from booking the same mentor/slot at the same time?

### AI Response

Frontend availability cannot be trusted because two users may submit the same slot simultaneously.

Booking creation must be handled transactionally.

The backend should:

1. Start a database transaction with SERIALIZABLE isolation.
2. Re-check mentor availability.
3. Check overlapping bookings.
4. Check the mentor's daily limit.
5. Assign the mentor.
6. Create the booking.
7. Commit the transaction.

The overlap condition should be:

```text
existingStart < newEnd
AND
existingEnd > newStart
```

This blocks:

```text
10:00–11:00
10:30–11:30
```

but allows:

```text
10:00–11:00
11:00–12:00
```

A conflict should return:

```text
HTTP 409
SLOT_UNAVAILABLE
```

---

## Session 9 — Initial Implementation

### User Prompt

Build the complete application according to this architecture. Include PostgreSQL, Prisma, React, Express, timezone handling, mentor allocation, dummy emails, tests, Docker, README, and TRANSCRIPT.md.

### AI Response

The application was implemented using:

```text
React
TypeScript
Vite
Tailwind CSS
Node.js
Express
Prisma
PostgreSQL
Luxon
Vitest
Docker Compose
```

The project was structured into:

```text
backend/
frontend/
docker-compose.yml
README.md
TRANSCRIPT.md
.env.example
package.json
```

The backend was separated into controllers, routes, services, repositories, validators, configuration, utilities, and tests.

The frontend contains the booking, confirmation, demo-class, and admin pages.

---

## Session 10 — Production Audit

### User Prompt

Perform a complete production audit. Verify the assignment requirements, timezone handling, DST, mentor limits, concurrency, overlap detection, validation, tests, build, lint, README, and transcript.

### AI Response

The audit verified:

- 10 seeded mentors.
- 2-class mentor-local daily limit.
- Parent booking flow.
- Automatic mentor allocation.
- Dummy parent and mentor emails.
- Dummy class links.
- Multi-timezone support.
- DST handling.
- No-availability UX.
- React frontend.
- Node/Express backend.
- README.
- Test suite.

The audit also identified improvements needed around:

- ESLint configuration.
- TypeScript/ESLint compatibility.
- Frontend tests.
- Concurrency verification.

These were subsequently addressed.

---

## Session 11 — Concurrency Verification

### User Prompt

The initial concurrency tests used a mock repository. Verify that the actual PostgreSQL implementation is safe under concurrent booking attempts. Do not claim that a mock mutex proves production concurrency safety.

### AI Response

The booking implementation was updated to use PostgreSQL `SERIALIZABLE` transaction isolation.

The booking service uses a Prisma transaction with serializable isolation.

Serialization failures are detected and retried.

The system re-evaluates mentor availability after a retry.

The final conflict is returned as:

```text
HTTP 409 SLOT_UNAVAILABLE
```

This prevents concurrent requests from incorrectly allocating the same mentor/slot.

The implementation also checks interval overlap rather than only exact start-time equality.

---

## Session 12 — Testing

### User Prompt

Run the complete test suite and verify the important edge cases.

### AI Response

The backend test suite covered:

- Available booking.
- Duplicate booking.
- Mentor daily limit.
- Mentor-local calendar day.
- Parent timezone conversion.
- Mentor timezone conversion.
- US DST.
- UK DST.
- India timezone.
- Invalid timezone.
- Past booking.
- Invalid email.
- No mentor availability.
- Parent email.
- Mentor email.
- API conflict handling.
- Concurrent booking behavior.

The backend suite passed:

```text
18 tests passed
```

Frontend tests were then added for the React UI.

---

## Session 13 — Local Environment Verification

### User Prompt

The application builds, but Docker/PostgreSQL, frontend tests, and TypeScript/ESLint compatibility need to be verified.

### AI Response

The environment was audited.

Changes included:

- Removed obsolete Docker Compose `version` field.
- Added/verified environment configuration.
- Added frontend Vitest/jsdom configuration.
- Added React Testing Library.
- Added frontend component tests.
- Updated TypeScript ESLint dependencies.
- Verified Docker/PostgreSQL configuration.
- Verified Prisma migration and seed configuration.

The final test setup contains:

```text
Backend: 18 tests
Frontend: 2 tests
Total: 20 tests
```

---

## Session 14 — Final Verification

### User Prompt

Perform the final verification and make sure the project is ready for GitHub submission.

### AI Response

The final implementation was verified for:

- Backend compilation.
- Frontend production build.
- ESLint.
- Backend tests.
- Frontend tests.
- PostgreSQL configuration.
- Prisma migration.
- Database seed.
- Booking flow.
- Mentor assignment.
- Timezone conversion.
- Dummy emails.
- Demo-class links.
- Admin dashboard.

The application is structured as a production-oriented assignment implementation while intentionally avoiding unnecessary features such as payments, real video infrastructure, and complex authentication.

---

## Session 15 — Class Link ID Mismatch Fix

### User Prompt

During final browser testing, booking creation succeeded, but clicking the generated demo class link returned:

`Booking with ID bk_... not found.`

The booking confirmation displayed a UUID booking ID, while the generated meeting link contained a separate `bk_...` identifier.

Diagnose and fix the mismatch without breaking the existing architecture.

### AI Response

The root cause was identified in the booking creation flow.

A temporary `bk_${Date.now()}_...` identifier was being generated before the Prisma database record was created. PostgreSQL/Prisma then generated a different UUID for the actual booking primary key.

Therefore:

- Database booking ID: UUID
- Meeting link ID: temporary `bk_...` value

The class page attempted to retrieve the booking using the temporary identifier, resulting in HTTP 404.

The booking creation logic was changed to generate the UUID before persistence using Node.js `crypto.randomUUID()` and explicitly use the same UUID as the database booking ID and meeting-link identifier.

The repository interface and implementations were updated to accept an optional booking ID.

The in-memory repository was also updated to return parent and mentor relation data during booking lookup so that test behavior matched the Prisma implementation.

---

## Session 16 — Final Browser Verification

### User Prompt

Perform a real browser test after fixing the class-link mismatch.

### AI Response

A fresh booking was created successfully.

The confirmation page displayed:

- Parent: Test Parent 2
- Parent timezone: America/New_York
- Parent local time: Monday, September 28, 2026 at 10:30 AM EDT
- Assigned mentor: Rajesh Kumar
- Mentor timezone: Asia/Kolkata
- Mentor local time: Monday, September 28, 2026 at 8:00 PM GMT+5:30
- Booking ID: a320e186-3bce-461a-8269-26749c786040

The generated class URL was:

`http://localhost:5173/class/a320e186-3bce-461a-8269-26749c786040`

The "Join Demo Class Now" button was clicked successfully.

The Demo Class portal loaded successfully and displayed:

- Booking ID
- Assigned tutor
- Parent local time
- Mentor local time
- Scheduled-class status

The Admin Dashboard was also opened successfully and displayed the new booking in the Recent Bookings Log.

The final automated verification reported:

- Backend tests: 18 passed
- Frontend tests: 2 passed
- Total tests: 20 passed
- ESLint: passed
- Production build: passed

The class-link resolution issue was fixed and verified through an actual browser flow.

---

## Session 17 — Final Documentation Review

### User Prompt

Review the final README and transcript before GitHub submission. Ensure that documentation matches the final implementation and does not contain outdated class-link examples or unsupported claims.

### AI Response

The final documentation review identified and corrected:

1. Outdated `bk_...` meeting-link examples in README.md.
2. API examples that did not match the final UUID-based booking ID.
3. The Node.js prerequisite wording that claimed testing on an unverified version.
4. The transcript wording so that the reconstructed transcript is clearly identified as reconstructed rather than a raw transcript export.

The final README documents the actual architecture, timezone handling, DST handling, mentor-local daily limits, transactional booking protection, API behavior, setup instructions, testing, and design decisions.

The final transcript documents the major AI-assisted development sessions, including the class-link debugging and final browser verification.

---

# Final Development Decisions

The major engineering decisions made during the AI-assisted development were:

1. **UTC is the source of truth** for appointments.

2. **IANA timezone identifiers** are stored for parents and mentors.

3. **DST is handled by timezone-aware libraries**, not manually calculated offsets.

4. **Mentor capacity is based on the mentor's local calendar day.**

5. **Mentor allocation uses workload balancing** to distribute trial classes.

6. **The backend is authoritative** for slot availability.

7. **Booking creation uses database transactions** to protect against concurrent booking conflicts.

8. **Overlapping appointments are explicitly detected.**

9. **Email delivery is abstracted** so a real provider can be added later.

10. **The application intentionally avoids unnecessary scope** such as payments, real video conferencing, and authentication because these are outside the assignment requirements.

---

# Final Project Status

The application contains:

- React frontend
- Node.js/Express backend
- PostgreSQL database
- Prisma ORM
- Timezone-aware booking
- DST handling
- 10 mentors
- 2-class daily mentor limit
- Automatic mentor assignment
- Concurrent booking protection
- Dummy email confirmations
- UUID-based dummy class links
- Working demo class portal
- Admin dashboard
- Automated tests
- Docker configuration
- README documentation
- AI-assisted development transcript

This transcript documents the AI-assisted development process and the major engineering decisions made during implementation.