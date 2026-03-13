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
