# SparkleClean — Task List

Track all in-progress and planned work here.
Mark items with [x] when complete. Never mark complete without proving it works.

---

## FEAT-001: Booking Confirmation Email
**Status:** Code complete — awaiting pnpm install + .env.local + prisma migrate
**Full spec:** `~/.claude/docs/features/FEAT-001-booking-confirmation-email.md`
**Depends on:** Nothing — this is the first Phase 2 feature

### Phase 2 project setup (do this first)
- [x] Create `develop` branch
- [x] Scaffold Next.js project structure (package.json, tsconfig, next.config, tailwind, postcss)
- [x] Configure `tailwind.config.ts` with SparkleClean brand tokens
- [ ] **YOU DO THIS:** Run `pnpm install` in CleaningCompanyApp/
- [ ] **YOU DO THIS:** Copy `.env.example` → `.env.local` and fill in Supabase URLs + Resend key
- [ ] **YOU DO THIS:** Sign up at supabase.com, create a project, copy connection strings to `.env.local`
- [ ] **YOU DO THIS:** Run first migration: `npx prisma migrate dev --name init`
- [ ] **YOU DO THIS:** Sign up at resend.com, get API key, add to `.env.local`
- [ ] **YOU DO THIS:** Verify `sparkleclean.com` domain in Resend dashboard

```bash
# Install Phase 2 dependencies
pnpm add @prisma/client resend @react-email/components bcryptjs next-auth@beta zod react-hook-form @hookform/resolvers
pnpm add -D prisma @types/bcryptjs typescript @types/node
```

### Types and schema
- [x] Create `src/types/booking.ts` — `CreateBookingSchema`, `CreateBookingInput`, `BookingResponse`, display maps
- [ ] Create `src/types/contact.ts`

### Database layer
- [x] Write Prisma schema — `Booking`, `ContactMessage`, `Admin` models + all enums + indexes
- [x] Write `prisma/seed.ts` — admin account seeder
- [x] Create `src/lib/prisma.ts` — singleton Prisma client
- [ ] **YOU DO THIS:** `npx prisma migrate dev --name init`

### Service layer
- [x] Create `src/services/bookingService.ts` — `createBooking()`, `calculateTotal()`, `getBookings()`, `updateBookingStatus()`
- [x] Create `src/services/emailService.ts` — `sendBookingConfirmation()` via Resend
- [x] Create `src/emails/BookingConfirmation.tsx` — branded React Email template

### API route
- [x] Create `src/app/api/bookings/route.ts` — POST handler (validate → save → email → 201)

### Frontend
- [x] Create `src/features/booking/hooks/useCreateBooking.ts` — React Query mutation
- [x] Create `src/features/booking/BookingForm.tsx` — React Hook Form + Zod, success state, all fields
- [x] Create `src/features/booking/PriceSummary.tsx` — live cost display, sticky on large screens
- [x] Create `src/app/booking/page.tsx`
- [x] Create `src/app/page.tsx` — Next.js homepage
- [x] Create `src/app/layout.tsx` + `globals.css`

### Email template
- [x] `BookingConfirmation.tsx` renders: reference, service, date, time, address, extras, total
- [x] Brand colours: primary `#4CAF50`, font Segoe UI
- [x] Subject: `Booking Confirmed — [Service] on [Date]`
- [x] From: `SparkleClean <bookings@sparkleclean.com>`
- [ ] **YOU DO THIS:** Test with Resend test mode before sending real emails

### Tests
- [x] `src/types/booking.test.ts` — schema accepts valid input, rejects past date, rejects bad ZIP
- [x] `src/services/bookingService.test.ts` — `calculateTotal()` base + extras
- [x] `src/app/api/bookings/route.test.ts` — 201, 400 on invalid, saves to DB, calls Stripe
- [x] `src/features/booking/BookingForm.test.tsx` — renders, shows errors, calls mutate on valid submit
- [x] `e2e/booking.spec.ts` — full booking flow, validation errors, mobile view

### Verify (before marking FEAT-001 complete)
- [ ] Submit a test booking — check Supabase dashboard for the record
- [ ] Confirmation email received in inbox (not spam)
- [ ] Invalid form submission shows inline errors
- [ ] Past date blocked
- [ ] `pnpm build` passes
- [ ] All tests passing: `pnpm test --run`

---

## FEAT-002: Admin Bookings Dashboard
**Status:** Code complete — requires pnpm install + .env.local + prisma migrate to verify
**Full spec:** `~/.claude/docs/features/FEAT-002-admin-dashboard.md`

### Prerequisites
- [ ] FEAT-001 complete and bookings in database
- [x] NextAuth.js v5 configured (see ADR-003)

### Tasks
- [x] Add `Admin` model to Prisma schema (done in FEAT-001 setup)
- [x] Create seed script: `prisma/seed.ts` (done in FEAT-001 setup)
- [x] Configure `auth.ts` (NextAuth Credentials provider)
- [x] Create `middleware.ts` — protect `/admin/*` routes
- [x] Admin login page: `src/app/admin/login/page.tsx`
- [x] Admin layout: `src/app/admin/layout.tsx`
- [x] Bookings list: `src/app/admin/bookings/page.tsx`
- [x] Booking detail: `src/app/admin/bookings/[id]/page.tsx`
- [x] PATCH `/api/bookings/:id` — status update (auth-protected)
- [x] E2E tests: `e2e/admin.spec.ts` — auth redirect, login page, 401 on PATCH

### Verify (before marking FEAT-002 complete)
- [ ] **YOU DO THIS:** Run `npx prisma db seed` to create the admin account
- [ ] **YOU DO THIS:** Visit `/admin/login` — login with your admin email/password
- [ ] **YOU DO THIS:** Confirm `/admin/bookings` lists bookings from the database
- [ ] **YOU DO THIS:** Open a booking → change status → confirm it persists on refresh
- [ ] **YOU DO THIS:** Confirm `/admin/bookings` redirects to login when signed out

---

---

## FEAT-003: Online Payment (Stripe)
**Status:** Code complete — requires Stripe account + keys to verify
**Full spec:** `~/.claude/docs/roadmap.md` (Phase 2B)

### Setup (you do this)
- [ ] Sign up at dashboard.stripe.com
- [ ] Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env.local`
- [ ] For local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Code (done)
- [x] Update Prisma schema — add `PENDING_PAYMENT` to `BookingStatus`, add `stripeSessionId` to `Booking`
- [x] Create `src/lib/stripe.ts` — Stripe singleton with API version pinned
- [x] Update `POST /api/bookings` — creates Checkout session, returns `checkoutUrl`, removes email (now in webhook)
- [x] Create `POST /api/stripe/webhook` — verifies signature, handles `checkout.session.completed` → status `PENDING` + email
- [x] Create `src/app/booking/success/page.tsx` — confirmation page after Stripe redirect
- [x] Create `src/app/booking/cancelled/page.tsx` — cancelled page
- [x] Update `BookingForm.tsx` — redirects to `checkoutUrl` on submit success
- [x] Update `BookingResponse` type — `checkoutUrl` replaces inline success
- [x] Update `.env.example` — Stripe vars now active (not commented)
- [x] Update E2E: `booking.spec.ts` button text, `e2e/payment.spec.ts` full payment flow tests

### Verify
- [ ] Submit booking form → redirected to Stripe Checkout (test mode)
- [ ] Complete payment with test card `4242 4242 4242 4242` → `/booking/success` page
- [ ] Webhook fires → booking status changes from `PENDING_PAYMENT` → `PENDING` in Supabase
- [ ] Confirmation email received after webhook fires
- [ ] Abandon checkout → `/booking/cancelled` page shown
- [ ] `stripe listen` shows webhook received 200

---

---

## FEAT-007: Admin Search + Filter
**Status:** Code complete

- [x] Update `getBookings()` to accept `{ search?, status?, page? }` options
- [x] Create `BookingsFilter.tsx` — client component, search input + status dropdown, clears pagination on change
- [x] Update `/admin/bookings` page — reads `search`/`status` from searchParams, pagination preserves filters
- [x] Empty state message varies by whether filters are active

---

## FEAT-006: Automated Reminder Emails (Vercel Cron)
**Status:** Code complete — requires Vercel deployment to activate cron

- [x] Update Prisma schema — add `reminderSentAt DateTime?` to `Booking`
- [x] Add `getBookingsForReminder()` — CONFIRMED bookings scheduled tomorrow, `reminderSentAt` null
- [x] Add `markReminderSent()` — stamps `reminderSentAt` after email sends
- [x] Create `src/emails/BookingReminder.tsx` — branded 24h reminder template
- [x] Create `src/services/reminderService.ts` — `sendTomorrowReminders()`, each booking processed independently
- [x] Create `GET /api/cron/reminders` — `Authorization: Bearer <CRON_SECRET>` required
- [x] Create `vercel.json` — cron schedule `0 9 * * *` (9am UTC daily)
- [x] Update `.env.example` — `CRON_SECRET` documented

### Verify
- [ ] **YOU DO THIS:** Add `CRON_SECRET` to `.env.local` and Vercel environment variables
- [ ] **YOU DO THIS:** Test locally: `curl -H "Authorization: Bearer <your-secret>" localhost:3000/api/cron/reminders`
- [ ] **YOU DO THIS:** After Vercel deploy — check Functions → Cron tab for invocation logs

---

---

## FEAT-005: Customer Account + Booking History
**Status:** Code complete

- [x] Add `Customer` model to Prisma schema
- [x] Add `next-auth.d.ts` — type augmentation for `role: 'admin' | 'customer'`
- [x] Update `auth.ts` — two Credentials providers (`admin-credentials`, `customer-credentials`); `authorized` callback redirects admin → `/admin/login`, customer → `/account/login`
- [x] Update `middleware.ts` — matcher covers `/admin/:path*` and `/account/:path*`
- [x] Create `customerService.ts` — `createCustomer()`, `getBookingsByEmail()`, `canCustomerCancel()`
- [x] Create `POST /api/account/register` — validates name/email/password, 409 on duplicate email
- [x] Create `POST /api/bookings/[id]/cancel` — customer owns booking + 24h policy; admins bypass policy
- [x] Create `src/app/account/layout.tsx` — auth-aware shell, sign-out button
- [x] Create `src/app/account/login/page.tsx` — server action login, link to register
- [x] Create `src/app/account/register/page.tsx` — client form, auto-login after registration
- [x] Create `src/app/account/bookings/page.tsx` — upcoming / past split, cancel button
- [x] Create `src/app/account/bookings/CancelButton.tsx` — two-step confirm → cancel → refresh
- [x] Create `src/app/booking/[reference]/page.tsx` — public shareable booking lookup
- [x] Add "My Account" link to Navbar

### Verify
- [ ] **YOU DO THIS:** Register at `/account/register` → auto-login → see booking history
- [ ] **YOU DO THIS:** Book as a guest, then sign in with same email — bookings appear
- [ ] **YOU DO THIS:** Cancel a booking ≥ 24h away → status changes to CANCELLED on refresh
- [ ] **YOU DO THIS:** Try to cancel < 24h away → error message shown
- [ ] **YOU DO THIS:** Visit `/booking/SC-XXXXXXXX` — booking details visible without login

---

## FEAT-010: Contact Form + Admin Inbox
**Status:** Code complete

- [x] `src/types/contact.ts` — `CreateContactSchema` + `CreateContactInput` (was already scaffolded)
- [x] `POST /api/contact` — saves to `ContactMessage` table (was already scaffolded)
- [x] `src/app/contact/page.tsx` — contact info sidebar + form (was already scaffolded)
- [x] `src/app/contact/ContactForm.tsx` — React Hook Form + Zod + useMutation, success state (was already scaffolded)
- [x] Create `src/services/contactService.ts` — `createContactMessage()`, `getMessages()`, `markMessageRead()`, `getMessageById()`
- [x] Create `PATCH /api/messages/[id]` — admin-only, marks message as read
- [x] Create `src/app/admin/messages/page.tsx` — inbox with unread filter, blue dot indicator, Reply mailto link
- [x] Create `src/app/admin/messages/MarkReadButton.tsx` — client button, calls PATCH, refreshes page
- [x] Update admin layout — "Messages" nav link

### Verify
- [ ] **YOU DO THIS:** Submit form at `/contact` → check `/admin/messages` for the new message
- [ ] **YOU DO THIS:** Click "Mark read" → blue dot disappears, unread count on dashboard updates

---

## FEAT-009: Admin Dashboard
**Status:** Code complete

- [x] Create `src/services/dashboardService.ts` — single `$transaction` for all stats (bookings this month, revenue, pending bookings, pending reviews, unread messages, upcoming confirmed, active schedules, recent bookings)
- [x] Rewrite `src/app/admin/page.tsx` — 6 stat cards (alert amber border when action needed), upcoming 7-day list, recent bookings list
- [x] Update admin layout logo — now links to `/admin` (dashboard) instead of `/admin/bookings`

### Stats shown
| Card | Query |
|------|-------|
| Bookings This Month | COUNT created this month, excl. PENDING_PAYMENT + CANCELLED |
| Revenue This Month | SUM total WHERE COMPLETED this month |
| Awaiting Confirmation | COUNT WHERE PENDING |
| Active Recurring Plans | COUNT WHERE ACTIVE |
| Reviews to Moderate | COUNT WHERE PENDING |
| Unread Messages | COUNT WHERE read = false |

### Verify
- [ ] **YOU DO THIS:** Navigate to `/admin` → stat cards render, links work

---

## FEAT-008: Reviews and Testimonials
**Status:** Code complete

- [x] Update Prisma schema — `Review` model, `ReviewStatus` enum (`PENDING | PUBLISHED | REJECTED`), `reviewToken`/`reviewInviteSentAt`/`review` on `Booking`
- [x] Create `src/emails/ReviewInvite.tsx` — branded invite email with unique review link
- [x] Create `src/services/reviewService.ts` — `sendReviewInvite()`, `getBookingByReviewToken()`, `validateReviewInput()`, `submitReview()`, `getPublishedReviews()`, `getReviews()`, `updateReviewStatus()`
- [x] Update `PATCH /api/bookings/[id]` — fires `sendReviewInvite()` non-blocking when status → COMPLETED
- [x] Create `POST /api/reviews` — token-validated submission endpoint
- [x] Create `PATCH /api/reviews/[id]` — admin-only publish/reject
- [x] Create `src/app/review/[token]/page.tsx` — handles invalid/used token states, renders form
- [x] Create `src/app/review/[token]/ReviewForm.tsx` — interactive star rating, title, body, char count
- [x] Create `src/app/admin/reviews/page.tsx` — moderation queue with status filter and pagination
- [x] Create `src/app/admin/reviews/ReviewActions.tsx` — Publish/Reject client buttons
- [x] Update admin layout — "Reviews" nav link
- [x] Update homepage — published reviews grid (up to 6), only shown when reviews exist
- [x] Update services page — published reviews strip (up to 3), only shown when reviews exist

### How reviews work
1. Admin marks booking as COMPLETED via `/api/bookings/[id]` PATCH
2. `sendReviewInvite()` fires non-blocking — generates UUID token, stores on booking, sends email
3. Customer visits `/review/<token>` — unique link, no login required
4. Customer submits star rating + title + body
5. Review saved with status `PENDING` (not yet visible to public)
6. Admin moderates at `/admin/reviews` — Publish or Reject
7. Published reviews appear on homepage and services page automatically

### Verify
- [ ] **YOU DO THIS:** Mark a booking COMPLETED → check email for review invite link
- [ ] **YOU DO THIS:** Visit `/review/<token>` → submit a review
- [ ] **YOU DO THIS:** Visit `/admin/reviews` → publish the review
- [ ] **YOU DO THIS:** Check homepage — review should appear in the grid

---

## Backlog (future features)

---

## FEAT-004: Recurring Booking Schedule Management
**Status:** Code complete

- [x] Update Prisma schema — `RecurringSchedule` model, `ScheduleStatus` enum, `recurringScheduleId` FK on `Booking`
- [x] Create `recurringService.ts` — `createRecurringSchedule()`, `generateOccurrences()`, `cancelSchedule()`, `getSchedules()`, `getScheduleById()`
- [x] Update `POST /api/bookings` — creates `RecurringSchedule` when frequency ≠ ONE_TIME, links first booking
- [x] Update Stripe webhook — after first payment, if recurring → generate 6 future occurrences as PENDING
- [x] Create `POST /api/recurring/[id]/cancel` — customer owns by email, admins unrestricted
- [x] Create `src/app/admin/recurring/page.tsx` — list with status filter, next booking, booking count
- [x] Create `src/app/admin/recurring/[id]/page.tsx` — full schedule detail + all occurrences table
- [x] Update admin layout — "Recurring" nav link
- [x] Update customer `getBookingsByEmail()` — includes `recurringScheduleId`
- [x] Add "Recurring" badge to booking rows in customer account
- [x] Add `CancelSeriesButton` — two-step confirm, calls `/api/recurring/:id/cancel`

### How recurring works
1. Customer selects weekly/bi-weekly/monthly frequency on booking form
2. `POST /api/bookings` creates `RecurringSchedule` record + first `Booking`
3. First booking goes through Stripe Checkout normally
4. Stripe webhook fires → marks first booking PENDING → generates 6 future `Booking` records (status: PENDING, no Stripe needed)
5. Staff confirms each occurrence as the date approaches
6. Admin can view all schedules at `/admin/recurring`
7. Customer or admin can cancel the series (all future PENDING/CONFIRMED bookings → CANCELLED)

### Verify
- [ ] **YOU DO THIS:** Book with frequency=WEEKLY → first booking goes to Stripe
- [ ] **YOU DO THIS:** Complete Stripe payment → check Supabase: 6 future bookings created with status PENDING
- [ ] **YOU DO THIS:** `/admin/recurring` shows the schedule with booking count
- [ ] **YOU DO THIS:** Cancel series from customer account → all future bookings cancelled

---

## FEAT-013: Sitemap + robots.txt
**Status:** Code complete

- [x] Create `src/app/sitemap.ts` — static routes: `/`, `/services`, `/booking`, `/contact`, `/about`, `/account/login`, `/account/register`; priorities and changeFrequency set per page type
- [x] Create `src/app/robots.ts` — allows all crawlers on public routes; disallows `/admin/`, `/api/`, `/account/`, `/review/`, `/booking/success`, `/booking/cancelled`; points to sitemap

### Verify
- [ ] **YOU DO THIS:** Visit `/sitemap.xml` in browser → 7 URLs listed
- [ ] **YOU DO THIS:** Visit `/robots.txt` → disallow rules visible

---

## FEAT-012: Rate Limiting on Public Routes
**Status:** Code complete — `src/lib/rateLimit.ts` was already built; applied to all public mutation endpoints

| Route | Limit |
|-------|-------|
| `POST /api/bookings` | 10 req / IP / hour (was already wired) |
| `POST /api/contact` | 5 req / IP / hour |
| `POST /api/reviews` | 5 req / IP / hour |
| `POST /api/account/register` | 10 req / IP / hour |

All return `429` with `Retry-After` header on breach.
In-memory store — replace with Upstash Redis for multi-instance deployments.

---

## FEAT-011: Admin Booking Detail Page
**Status:** Code complete (was already scaffolded)

- [x] `src/app/admin/bookings/[id]/page.tsx` — customer, service, financials, audit panels
- [x] `src/app/admin/bookings/[id]/StatusUpdater.tsx` — client toggle buttons, PATCH to `/api/bookings/[id]`

---

## FEAT-023: GDPR Account Deletion
**Status:** Code complete

- [x] Create `DELETE /api/account` — admin-only guarded; runs a Prisma `$transaction`: anonymises all bookings for that email (`name → '[deleted]'`, `email → deleted-<id>@example.com`, `phone → '[deleted]'`), then hard-deletes the `Customer` row. Bookings are kept for financial records.
- [x] Create `src/app/account/profile/DeleteAccountButton.tsx` — three-state client button: idle → confirming (inline warning box with Cancel) → deleting; on success redirects to `/?deleted=1`
- [x] Update `src/app/account/profile/page.tsx` — "Danger Zone" section at bottom of profile page renders `DeleteAccountButton`

---

## FEAT-022: Admin CSV Export
**Status:** Code complete

- [x] Create `GET /api/admin/bookings/export` — admin-only; accepts optional `?status=` filter; streams RFC-4180 CSV with proper `"..."` quoting and `""` escaping; filename includes today's date; 18 columns including all booking fields, total in USD, recurring flag
- [x] Update admin bookings page — "↓ Export CSV" download link in page header; passes active status filter to the export URL so filtered view exports only those rows

---

## FEAT-021: Pre-fill Booking Form for Logged-in Customers
**Status:** Code complete

- [x] Add `BookingFormPrefill` interface + `prefill` prop to `BookingForm` — spreads into `useForm` `defaultValues`
- [x] Add `zip` and `phone` to `getBookingsByEmail()` select (were missing)
- [x] Convert `booking/page.tsx` to `async` server component — checks session role; if `customer`, fetches `getCustomerById()` + `getBookingsByEmail()` in parallel; builds prefill from customer name/email + most recent booking's address fields
- [x] Header message changes to "Welcome back, [name]! Your details are pre-filled below." when session is active

---

## FEAT-020: Booking Confirmed Email (Staff → Customer)
**Status:** Code complete

- [x] Create `src/emails/BookingConfirmedByStaff.tsx` — green-header email with appointment details and pre-arrival tips; distinct from the payment receipt sent by the webhook
- [x] Add `sendBookingConfirmedEmail()` to `src/services/emailService.ts`
- [x] Update `PATCH /api/bookings/[id]` — fires `sendBookingConfirmedEmail()` non-blocking when status transitions **to** CONFIRMED (guard: `existing.status !== 'CONFIRMED'` prevents duplicate sends)

**Email chain per booking:**
1. Payment success (webhook) → `BookingConfirmation` — "We received your booking"
2. Admin sets CONFIRMED → `BookingConfirmedByStaff` — "We confirmed your appointment" ← NEW
3. 24h before → `BookingReminder` — appointment reminder
4. Admin sets COMPLETED → `ReviewInvite` — leave a review

---

## FEAT-019: Customer Profile Page
**Status:** Code complete

- [x] Add `updateCustomerProfile()`, `getCustomerById()`, `verifyCustomerPassword()` to `customerService.ts`
- [x] Create `PATCH /api/account/profile` — validates with Zod; requires `currentPassword` to set `newPassword`; bcrypt verification before hash update
- [x] Create `src/app/account/profile/page.tsx` — server component, fetches customer by session ID
- [x] Create `src/app/account/profile/ProfileForm.tsx` — client form: name field, read-only email, password change section (current + new + confirm); client-side confirm match check
- [x] Update `src/app/account/layout.tsx` — "Profile" nav link added

---

## FEAT-018: Privacy Policy + Terms of Service
**Status:** Code complete

- [x] Create `src/app/privacy/page.tsx` — 8-section privacy policy (data collected, usage, sharing, retention, rights, cookies, changes, contact)
- [x] Create `src/app/terms/page.tsx` — 10-section terms of service (acceptance, services, payment, cancellation, customer responsibilities, liability, satisfaction guarantee, accounts, governing law, changes)
- [x] Fix `Footer.tsx` — `/privacy` and `/terms` links (were `#`)
- [x] Add `/privacy` and `/terms` to `sitemap.ts`

---

## FEAT-016: App Shell — Error, Loading, and 404 Pages
**Status:** Code complete

- [x] Create `src/app/not-found.tsx` — branded 404 with "Back to Home" + "Contact Support" links; uses `text-brand-200` for the large 404 numeral
- [x] Create `src/app/error.tsx` — `'use client'` error boundary; logs to console (swap for Sentry); shows error `digest` ID; "Try Again" button calls `reset()`
- [x] Create `src/app/loading.tsx` — centred brand-coloured spinner shown during server component data fetching

---

## FEAT-015: OpenGraph + Twitter Card Meta Tags
**Status:** Code complete

- [x] `src/app/layout.tsx` — site-wide `openGraph` and `twitter` defaults (card: `summary_large_image`); `metadataBase` already set
- [x] Per-page overrides with correct `url`, `title`, `description` for: `/` · `/services` · `/about` · `/contact` · `/booking`

**Note:** Add an OG image (`/public/og-image.png`, 1200×630) and reference it in `layout.tsx` under `openGraph.images` to enable rich link previews on social platforms.

---

## FEAT-025: Content Security Policy + HSTS
**Status:** Code complete

- [x] Rewrote `next.config.ts` — structured `csp()` helper builds flat CSP string from directive map; `isDev` flag relaxes `unsafe-eval` and omits HSTS in development
- [x] CSP directives:
  - `script-src 'self' 'unsafe-inline'` (+ `unsafe-eval` in dev for HMR)
  - `style-src 'self' 'unsafe-inline'` (Tailwind inline styles)
  - `frame-src https://js.stripe.com` (Stripe hosted checkout redirect)
  - `frame-ancestors 'none'` · `object-src 'none'` · `base-uri 'self'` · `form-action 'self'`
  - `upgrade-insecure-requests` in production only
- [x] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` added (production only)
- [x] Empty-value headers filtered out so no blank header values are sent

---

## FEAT-024: Booking Cancellation Email
**Status:** Code complete

- [x] Create `src/emails/BookingCancelled.tsx` — grey header (visually distinct from green confirmation/reminder); `cancelledBy: 'customer' | 'admin'` prop changes the body copy; "Book a new appointment" CTA
- [x] Add `sendBookingCancelledEmail(booking, cancelledBy)` to `emailService.ts`
- [x] Wire to `POST /api/bookings/[id]/cancel` — fires non-blocking after status update with correct `cancelledBy` derived from session role
- [x] Wire to `PATCH /api/bookings/[id]` — fires non-blocking when status transitions **to** CANCELLED (guard: `existing.status !== 'CANCELLED'`) with `cancelledBy: 'admin'`

**Complete email chain:**
1. Payment webhook → Receipt ("Your booking is received")
2. Admin → CONFIRMED → "Your appointment is confirmed"
3. 24h before → Reminder
4. Admin or customer → CANCELLED → "Your booking has been cancelled" ← NEW
5. Admin → COMPLETED → Review invite

---

---

## FEAT-026: Dynamic OG Image
**Status:** Code complete

- [x] Create `src/app/opengraph-image.tsx` — Next.js edge ImageResponse (1200×630, brand green, SparkleClean logo + tagline + service badges)
- [x] Update `src/app/layout.tsx` — `openGraph.images` and `twitter.images` now reference `/opengraph-image`

### Verify
- [ ] **YOU DO THIS:** Visit `/opengraph-image` in browser — branded green card renders
- [ ] **YOU DO THIS:** Paste site URL into https://www.opengraph.xyz — preview shows correctly

---

## FEAT-027: Upstash Redis Rate Limiting
**Status:** Code complete

- [x] Create `src/lib/rateLimiter.ts` — Upstash sliding-window when env vars present, falls back to in-memory for local dev
- [x] All public mutation routes now use `checkRateLimit` from `rateLimiter.ts`

### Verify
- [ ] **YOU DO THIS:** Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to `.env.local` — switch from in-memory to Redis automatically

---

## FEAT-028: Admin Notes on Bookings
**Status:** Code complete

- [x] Prisma schema — `adminNotes String? @db.Text` on `Booking`
- [x] `GET/PATCH /api/admin/bookings/[id]/notes` — admin-only endpoint
- [x] `AdminNotesEditor.tsx` — autosave textarea in booking detail page
- [x] `src/app/admin/bookings/[id]/page.tsx` — renders `AdminNotesEditor`

---

## FEAT-029: Customer Password Reset
**Status:** Code complete

- [x] Prisma schema — `passwordResetToken`, `passwordResetExpiresAt` on `Customer`
- [x] `createPasswordResetToken()`, `resetPasswordWithToken()` in `customerService.ts`
- [x] `sendPasswordResetEmail()` in `emailService.ts`
- [x] `src/emails/PasswordReset.tsx` — branded blue reset email, 1-hour expiry
- [x] `POST /api/account/forgot-password` — rate-limited (5/hr), always 200 to prevent email enumeration
- [x] `POST /api/account/reset-password` — validates UUID token + expiry, bcrypt-hashes new password
- [x] `src/app/account/forgot-password/page.tsx` — email input form
- [x] `src/app/account/reset-password/[token]/page.tsx` — new password form
- [x] Login page — "Forgot your password?" link

### Verify
- [ ] **YOU DO THIS:** Click "Forgot your password?" on `/account/login` → receive reset email
- [ ] **YOU DO THIS:** Click reset link → set new password → can log in with it
- [ ] **YOU DO THIS:** Try the same reset link again → "link expired" error shown

---

## FEAT-030: Customer Booking Rescheduling
**Status:** Code complete

- [x] `rescheduleBooking()` in `bookingService.ts`
- [x] `sendBookingRescheduledEmail()` in `emailService.ts`
- [x] `src/emails/BookingRescheduled.tsx` — orange-header email with updated date/time
- [x] `POST /api/bookings/[id]/reschedule` — auth-protected, customer owns booking + 24h policy
- [x] `src/app/account/bookings/[id]/page.tsx` — booking detail with reschedule link
- [x] `src/app/account/bookings/[id]/reschedule/page.tsx` + `RescheduleForm.tsx` — date/time picker

### Verify
- [ ] **YOU DO THIS:** From `/account/bookings` → open a booking → click Reschedule
- [ ] **YOU DO THIS:** Pick a new date/time → submit → confirmation email arrives
- [ ] **YOU DO THIS:** Try to reschedule within 24h → error shown

---

---

## FEAT-032: Admin Bulk Status Update
**Status:** Code complete

- [x] Add `bulkUpdateBookingStatus(ids, status)` to `bookingService.ts` — single `updateMany` query
- [x] Add `getBookingsByIds(ids)` to `bookingService.ts` — for pre/post-update email guards
- [x] Create `POST /api/admin/bookings/bulk` — admin-only; validates UUIDs (max 100), status CONFIRMED|CANCELLED; fires confirmation/cancellation emails non-blocking via `Promise.allSettled`
- [x] Create `src/app/admin/bookings/BookingsTable.tsx` — client component; checkbox per row + select-all; floating dark action bar (Confirm / Cancel / ✕ clear); calls bulk API + `router.refresh()` on success
- [x] Update `src/app/admin/bookings/page.tsx` — replaced inline table with `<BookingsTable>`; pagination moved outside component
- [x] `src/app/api/admin/bookings/bulk/__tests__/route.test.ts` — 12 tests: auth, validation, happy path × 2, email guard, multiple IDs

### Verify
- [ ] **YOU DO THIS:** Go to `/admin/bookings` → check 2+ PENDING bookings → click "Confirm" → all turn CONFIRMED
- [ ] **YOU DO THIS:** Customers receive confirmation emails (check inbox)
- [ ] **YOU DO THIS:** Try to bulk-cancel already-cancelled bookings → no duplicate emails sent

---

## FEAT-031: Per-page OG Images
**Status:** Code complete

- [x] `src/app/booking/opengraph-image.tsx` — dark gradient, "Book Your Cleaning Online"
- [x] `src/app/services/opengraph-image.tsx` — light card grid, 4 service cards with prices
- [x] `src/app/about/opengraph-image.tsx` — brand green, 4 trust pillars

---

## Test Coverage (as of 2026-03-13)
**21 test files · 257 tests · all passing**

| Test file | Tests |
|-----------|-------|
| types/booking | 14 |
| lib/rateLimit | 12 |
| services/bookingService | 34 |
| services/customerService | 13 |
| services/reviewService | 23 |
| features/booking/BookingForm | 11 |
| api/bookings (POST) | 15 |
| api/bookings/[id] (PATCH) | 16 |
| api/bookings/[id]/cancel (POST) | 8 |
| api/bookings/[id]/reschedule (POST) | 13 |
| api/admin/bookings/bulk (POST) | 12 |
| api/admin/bookings/export (GET) | 10 |
| api/contact (POST) | 13 |
| api/reviews (POST) | 10 |
| api/reviews/[id] (PATCH) | 8 |
| api/account/register (POST) | 10 |
| api/account/forgot-password (POST) | 8 |
| api/account/reset-password (POST) | 8 |
| api/account/profile (PATCH) | 10 |
| api/account (DELETE) | 5 |
| api/messages/[id] (PATCH) | 6 |

---

## FEAT-033: Staff Assignment
**Status:** Code complete

### Data model
- [x] Add `Cleaner` model — id, email, passwordHash, name, phone, active
- [x] Add `cleanerId` optional FK on `Booking` + `@@index([cleanerId])`
- [x] Update `src/types/next-auth.d.ts` — `role` union includes `'cleaner'`

### Service layer
- [x] Create `src/services/cleanerService.ts` — `getCleaners()`, `getCleanerById()`, `getCleanerByEmail()`, `createCleaner()`, `verifyCleanerPassword()`, `assignBookingToCleaner()`, `getAssignedBookings(cleanerId)`

### API routes
- [x] `POST /api/admin/bookings/[id]/assign` — admin-only; validates UUID or null; 404 on missing/inactive cleaner
- [x] `GET /api/admin/cleaners` — admin-only; returns active cleaners
- [x] `POST /api/admin/cleaners` — admin-only; creates cleaner; 409 on duplicate email

### Auth
- [x] `auth.ts` — third `cleaner-credentials` Credentials provider; `authorized()` callback protects `/cleaner/*`
- [x] `middleware.ts` — matcher includes `/cleaner/:path*`

### Admin UI
- [x] `src/app/admin/cleaners/page.tsx` — list of active cleaners with "+ Add Cleaner" button
- [x] `src/app/admin/cleaners/new/page.tsx` — client form, calls `POST /api/admin/cleaners`
- [x] `src/app/admin/bookings/[id]/CleanerAssignmentSelect.tsx` — dropdown + Save button, calls assign endpoint
- [x] `src/app/admin/bookings/[id]/page.tsx` — Staff Assignment card in sidebar
- [x] `src/app/admin/layout.tsx` — "Cleaners" nav link added

### Cleaner portal
- [x] `src/app/cleaner/login/page.tsx` — Credentials login with `cleaner-credentials`
- [x] `src/app/cleaner/layout.tsx` — branded header, user name, sign-out
- [x] `src/app/cleaner/bookings/page.tsx` — shows upcoming/past assigned bookings, service details, customer notes

### Tests
- [x] `api/admin/bookings/[id]/assign` — 11 tests: auth, not found, validation, happy path, unassign
- [x] `api/admin/cleaners` — 11 tests: GET auth, list; POST auth, create, 409, validation

### Verify (you do this)
- [ ] Run `npx prisma migrate dev --name add-cleaner` to apply schema changes
- [ ] Go to `/admin/cleaners` → "+ Add Cleaner" → fill form → cleaner appears in list
- [ ] Go to a booking detail → assign the cleaner from the dropdown → click Save
- [ ] Sign in at `/cleaner/login` with the cleaner's credentials → bookings page shows the assigned booking
- [ ] Assign a different booking → sign in as cleaner → both appear in the list

---

## FEAT-034: Referral Programme
**Status:** Code complete

### Data model (already in schema from prior work)
- [x] `ReferralCode` model — id, code (unique SC-XXXXXXXX), customerId (unique FK), uses, createdAt
- [x] `referralCodeId` optional FK on `Booking` + `discountAmount Int @default(0)` (pence)

### Service layer (already built)
- [x] `src/services/referralService.ts` — `getOrCreateReferralCode()`, `validateReferralCode()`, `recordReferralUse()`, `getReferralStats()`, `calculateReferralDiscount()`, `REFERRAL_DISCOUNT_PCT` (10%), `REFERRAL_DISCOUNT_MAX` (£50)

### API routes
- [x] `GET /api/account/referral` — customer-only; lazy-creates code; returns code + uses
- [x] `GET /api/referral/validate?code=` — public, rate-limited (20/hr); validates code, returns `{ valid: true }`

### Booking form integration (already wired in POST /api/bookings)
- [x] `referralCode` field in `CreateBookingSchema` — optional, trim + uppercase
- [x] `POST /api/bookings` — validates code server-side, applies discount, records use after Stripe webhook

### Frontend
- [x] `BookingForm.tsx` — referral code input field; on-blur calls validate endpoint; shows green/red feedback + discount %
- [x] `PriceSummary.tsx` — purple referral discount line when code validated (10% off, capped at £50)
- [x] `src/app/account/referral/page.tsx` — shareable code + link, copy buttons, usage stats, how-it-works steps
- [x] `src/app/account/referral/CopyCodeButton.tsx` — client clipboard component
- [x] `src/app/account/layout.tsx` — "Refer a Friend" nav link added

### Admin
- [x] `src/app/admin/referrals/page.tsx` — summary stats (total codes, uses, est. discount given) + top referrers table
- [x] `src/app/admin/layout.tsx` — "Referrals" nav link added

### Tests
- [x] `api/account/referral` — 6 tests: 401 cases (no session, admin, cleaner), happy path, getOrCreate called with session id, uses=0 fallback
- [x] `api/referral/validate` — 5 tests: rate limit, missing code, unknown code, valid code, uppercase normalisation

### Verify (you do this)
- [ ] Visit `/account/referral` as a logged-in customer → code displayed, copy buttons work
- [ ] Enter code on `/booking` form → green tick + "10% off" appears in price summary
- [ ] Complete a booking with a referral code → `discountAmount` saved in Supabase
- [ ] Visit `/admin/referrals` → top referrers table renders
