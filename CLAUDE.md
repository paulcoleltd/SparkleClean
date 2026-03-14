# SparkleClean — Project Instructions

**App:** SparkleClean (`paulcoleltd/SparkleClean` on GitHub)
**Purpose:** Professional cleaning services website — booking, marketing, admin
**Current phase:** Phase 1 complete (static HTML/CSS/JS). Phase 2 starting (Next.js + backend).

---

## Current Stack (Phase 1 — live)

- Vanilla HTML5, CSS3, JavaScript (ES6)
- No framework, no build tool, no package manager
- Files: `index.html`, `services.html`, `about.html`, `contact.html`, `booking.html`
- Styles: `css/styles.css` (CSS custom properties)
- JS: `js/main.js` (validation, forms, booking summary)

**To view locally:** open `index.html` in a browser or run `npx serve .`

---

## Target Stack (Phase 2 — building now)

Next.js 14 · TypeScript strict · TailwindCSS · shadcn/ui · React Query · Zustand ·
Zod · React Hook Form · Prisma · PostgreSQL (Supabase) · Resend · NextAuth.js v5 · pnpm

See architecture decisions:
- `~/.claude/docs/adr/ADR-001-database.md` — PostgreSQL / Supabase / Prisma
- `~/.claude/docs/adr/ADR-002-email-provider.md` — Resend + React Email
- `~/.claude/docs/adr/ADR-003-auth-strategy.md` — NextAuth.js v5 Credentials

---

## Brand Identity (never change without updating memory)

| Token | Value |
|-------|-------|
| Brand name | SparkleClean |
| Tagline | "Your Home Deserves to Sparkle" |
| Primary colour | `#4CAF50` (green) |
| Secondary colour | `#2196F3` (blue) |
| Accent colour | `#FF9800` (orange) |
| Font | `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` |
| Email | info@sparkleclean.com |
| Phone | (123) 456-7890 |

---

## Services & Pricing (server-side source of truth)

| Service | Base price |
|---------|-----------|
| Residential Cleaning | $150 (15000 cents) |
| Commercial Cleaning | $200 (20000 cents) |
| Deep Cleaning | $300 (30000 cents) |
| Specialized Cleaning | $250 (25000 cents) |

| Extra | Price |
|-------|-------|
| Window cleaning | +$50 (5000 cents) |
| Carpet cleaning | +$75 (7500 cents) |
| Laundry | +$40 (4000 cents) |
| Organisation | +$60 (6000 cents) |

**Rule: pricing is always calculated server-side. Never trust a total from the client.**

---

## Phase 2 Build Order

1. **FEAT-001** — Booking confirmation email (P0, start here)
   `~/.claude/docs/features/FEAT-001-booking-confirmation-email.md`

2. **FEAT-002** — Admin bookings dashboard (P0, after FEAT-001)
   `~/.claude/docs/features/FEAT-002-admin-dashboard.md`

3. FEAT-003 — Online payment with Stripe (P1)
4. FEAT-004 — Recurring booking management (P1)
5. FEAT-005 — Customer login + booking history (P2)

See full roadmap: `~/.claude/docs/roadmap.md`

---

## Workflow Rules

- **Plan before building:** write plan to `tasks/todo.md` before writing code
- **Self-improvement:** after any correction, add to `tasks/lessons.md`
- **Verify before done:** never mark a task complete without proving it works
- **Minimal impact:** only touch what is necessary

---

## Skills to Apply (in order)

For any coding task:
1. `~/.claude/skills/mitre-attack-reasoning-skill/` — security assessment (always)
2. `~/.claude/skills/secure-operator.md` — flag risky actions before executing

For frontend work:
3. `~/.claude/skills/frontend-engineer.md`
4. `~/.claude/skills/ui-designer.md`
5. `~/.claude/skills/accessibility-auditor.md`

For backend / Phase 2 work:
3. `~/.claude/skills/backend-engineer.md`
4. `~/.claude/skills/api-designer.md`
5. `~/.claude/skills/database-architect.md`

For deployment:
- `~/.claude/skills/devops-engineer.md`
- `~/.claude/workflows/deployment-workflow.md`

For debugging:
- `~/.claude/skills/debugging-specialist.md`
- `~/.claude/workflows/bugfix-workflow.md`

---

## Key File Locations

| What | Where |
|------|-------|
| Global skills | `~/.claude/skills/` |
| Feature briefs | `~/.claude/docs/features/` |
| ADRs | `~/.claude/docs/adr/` |
| Templates | `~/.claude/docs/templates/` |
| Workflows | `~/.claude/workflows/` |
| This project's tasks | `CleaningCompanyApp/tasks/todo.md` |
| Lessons learned | `CleaningCompanyApp/tasks/lessons.md` |
| Env var template | `CleaningCompanyApp/.env.example` |
