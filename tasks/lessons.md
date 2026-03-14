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

---

## Lesson: CSP script-src must include all external JS sources — 2026-03-14

**Bug:** CSP `script-src 'self' 'unsafe-inline'` blocked `https://js.stripe.com/v3/`
from loading. Stripe Elements silently failed to initialise in production.

**Fix:** Add `'https://js.stripe.com'` to `script-src`. Audit every external JS file
loaded by the page before finalising the policy.

**Pattern to avoid:** Thinking `frame-src` and `connect-src` are sufficient for Stripe.
Stripe loads an external script AND iframes AND makes API calls — all three directives
must include its domains.

---

## Lesson: Role-check the JWT, not just its existence — 2026-03-14

**Bug:** The `/account` route guard checked `!session?.user` but not `session.user.role`.
A logged-in cleaner or admin could navigate to customer dashboard pages.

**Fix:** Check `session.user.role !== 'customer'` (or the expected role) in addition to
presence. Each protected route family (`/admin`, `/cleaner`, `/account`) must verify
the correct role, not just authentication.

**Pattern to avoid:** `if (!session?.user) redirect()` without a role assertion.

---

## Lesson: `__Secure-` cookies require the `secure` attribute when clearing — 2026-03-14

**Bug:** `response.cookies.set('__Secure-authjs.session-token', '', { maxAge: 0 })` was
silently ignored by the browser on HTTPS. RFC 6265 §4.1.2.5 requires any `Set-Cookie`
for a `__Secure-` prefixed name to include the `Secure` attribute.

**Fix:** Always include `{ secure: true, httpOnly: true, sameSite: 'lax' }` when setting
or clearing `__Secure-` cookies.

**Pattern to avoid:** Clearing a `__Secure-` cookie without the `secure` attribute.

---

## Lesson: Stripe webhook 404 prevents retries — 2026-03-14

**Bug:** Returning HTTP 404 when a booking is not found for a Stripe session tells Stripe
"permanently failed". Stripe only retries on 5xx. A race condition (webhook arriving
before the booking DB write commits) would leave the booking stuck in PENDING_PAYMENT.

**Fix:** Return 500 (not 404) for booking-not-found in the webhook handler so Stripe
retries. Alternatively, implement an exponential-backoff retry loop inside the handler.

**Pattern to avoid:** Using 4xx codes for transient states in Stripe webhook handlers.

---

## Lesson: Wrap all DB calls in try/catch in auth-critical routes — 2026-03-14

**Bug:** `resetPasswordWithToken()` was called without a try/catch. A Prisma error would
propagate as an unhandled exception, leaving the user uncertain whether their password
was changed. No structured error body was returned.

**Fix:** Wrap every DB call in auth routes in try/catch with a structured 500 response
and console.error so the failure is logged and the user gets a clear message.

**Pattern to avoid:** Calling async DB functions in route handlers without try/catch when
the error path leaves user data in an ambiguous state.

---

## Lesson: Token-before-email is the correct order for single-use links — 2026-03-14

**Bug:** `sendReviewInvite` sent the email first, then wrote the token to the DB. If the
DB write failed after email delivery, the customer received a review link that permanently
returned "invalid token" — no recovery path.

**Fix:** Write the token to the DB first. If the email subsequently fails, the token is
safe in the DB and the operation can be retried. An undelivered email with a valid token
is recoverable; a delivered email with no token is not.

**Pattern to avoid:** Sending a single-use link before persisting the token it references.
