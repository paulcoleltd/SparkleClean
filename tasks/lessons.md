# Lessons Learned

Record patterns to avoid here after every correction or bug fix.
Format: `## Lesson: <title> — <date>`

---

## Lesson: Always save to DB before sending email — 2026-03-12

**Bug:** If email is sent before DB save, a Resend failure would result in a
customer receiving a confirmation for a booking that was never stored.

**Root cause:** Wrong operation order in the API route handler.

**Fix:** Always follow this order in `POST /api/bookings`:
1. Validate input (Zod)
2. Calculate total (server-side)
3. Save to database — if this fails, return 500 immediately
4. Send email — if this fails, log the error but still return 201

**Pattern to avoid:** Sending side-effects (email, SMS, webhook) before the
primary write to the database has been confirmed.

---

## Lesson: Never trust client-supplied totals — 2026-03-12

**Bug (potential):** The booking form's live cost summary is calculated in the
browser. If a user manipulates the form data before submission, they could
submit a falsified total.

**Root cause:** The Phase 1 form calculated cost client-side only.

**Fix:** `calculateTotal()` lives in `src/services/bookingService.ts` and runs
on the server in the API route. Any `total` sent from the client is ignored.

**Pattern to avoid:** Never do financial calculations client-side without
server-side verification. The client is untrusted input.

---

## Lesson: Use `.env.example` to document all required env vars — 2026-03-12

**Bug (potential):** A new environment (staging, another developer's machine)
is missing a required env var and fails silently or with a cryptic error.

**Fix:** Every required env var is listed in `.env.example` with a description
but no real value. `.env.local` is git-ignored. `.env.example` is committed.

**Pattern to avoid:** Undocumented env var requirements. If the app needs a
variable, it must be in `.env.example`.

---

## Lesson: Email BEFORE token — 2026-03-14

**Bug:** `sendReviewInvite` wrote the review token to the DB before sending the
email. If Resend failed, the token existed in the DB but the customer never got
the link — it became unreachable (orphaned token).

**Fix:** Send email first. Only persist the token to DB after delivery succeeds.
If email throws, the catch in the caller logs it and no token is written.

**Pattern to avoid:** Writing any single-use token to the DB before confirming
the delivery channel (email/SMS) has accepted the message.

---

## Lesson: Constant-time auth prevents email enumeration — 2026-03-14

**Bug:** All 3 auth providers returned `null` immediately when the user was
not found, without running bcrypt. An attacker measuring response latency could
distinguish "user doesn't exist" (~5 ms DB query) from "wrong password" (~250 ms
bcrypt). This enables email enumeration (MITRE T1589.002).

**Fix:** Compute `DUMMY_HASH_PROMISE = bcrypt.hash(...)` once at module startup.
In every provider's `authorize`, always `await bcrypt.compare(password, dummyHash)`
before returning null, even when the user record is missing.

**Pattern to avoid:** Any auth code path that short-circuits before bcrypt runs.

---

## Lesson: JWT sessions must be periodically re-validated — 2026-03-14

**Bug:** `auth.ts` issued JWTs with no revocation mechanism. Deleting a customer
account or deactivating a cleaner had no effect until their token expired (default
30 days). A deleted user could continue making authenticated API calls.

**Fix (two-layer):**
1. On account deletion, clear the session cookie in the response (immediate effect
   for the deleting browser).
2. In the `jwt` callback, call `verifyUserExists()` every 5 minutes and return
   `null` if the user is gone (invalidates the JWT for other sessions/devices).

**Pattern to avoid:** JWT-only auth with no server-side re-validation step.

---

## Lesson: Rate-limit before bcrypt/DB, not after — 2026-03-14

**Bug:** The password-reset consumption endpoint had no rate limiting. An attacker
could brute-force UUID tokens (astronomically hard statistically, but still a gap).

**Fix:** Apply `rateLimit()` as the very first operation in auth-adjacent POST handlers
— before JSON parsing, Zod validation, DB queries, or bcrypt. This keeps the server
load low under attack.

**Pattern to avoid:** Running expensive operations (bcrypt, Prisma) before rate
limiting. The rate limiter is cheap; everything else is not.

---

## Lesson: MONTHLY recurring must use calendar months — 2026-03-14

**Bug:** `generateOccurrences` used `INTERVAL_DAYS.MONTHLY = 30`. Over 6 months
this drifts: a customer booked for Jan 31 would get Feb 28, Apr 9, May 9, Jun 8...
instead of Feb 28, Mar 31, Apr 30, May 31, Jun 30.

**Fix:** Use `Date.setMonth(getMonth() + n)` with end-of-month clamping (if JS
overflows to the next month, call `setDate(0)` to go back to the last valid day).

**Pattern to avoid:** Using fixed-day arithmetic for any unit larger than a week.

---

## Lesson: CSP connect-src must list all external API domains — 2026-03-14

**Bug:** CSP `connect-src 'self'` blocked Stripe API calls and Supabase REST calls
from the browser. Stripe.js needs `https://api.stripe.com` and
`https://checkout.stripe.com`; Supabase client needs `https://*.supabase.co`.

**Fix:** Add those domains to `connect-src` in `next.config.mjs`.

**Pattern to avoid:** Setting `connect-src: ['self']` before auditing which external
domains the JS runtime actually calls at runtime.
