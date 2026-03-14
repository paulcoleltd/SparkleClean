-- ============================================================
-- SparkleClean — Full Schema + Test Data
-- Paste this entire file into the Supabase SQL Editor and click Run
-- https://supabase.com/dashboard/project/alqhcxinnhirtkpevmem/sql/new
-- ============================================================

-- ─── 1. ENUMS ─────────────────────────────────────────────────────────────────

CREATE TYPE "ServiceType"    AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'DEEP', 'SPECIALIZED');
CREATE TYPE "Frequency"      AS ENUM ('ONE_TIME', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');
CREATE TYPE "PropertySize"   AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE "TimeSlot"       AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');
CREATE TYPE "Extra"          AS ENUM ('WINDOWS', 'CARPETS', 'LAUNDRY', 'ORGANIZATION');
CREATE TYPE "BookingStatus"  AS ENUM ('PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ScheduleStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
CREATE TYPE "ReviewStatus"   AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- ─── 2. TABLES ────────────────────────────────────────────────────────────────

CREATE TABLE "admins" (
  "id"           TEXT         NOT NULL,
  "email"        VARCHAR(254) NOT NULL,
  "passwordHash" TEXT         NOT NULL,
  "name"         VARCHAR(100) NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "customers" (
  "id"                     TEXT         NOT NULL,
  "email"                  VARCHAR(254) NOT NULL,
  "passwordHash"           TEXT         NOT NULL,
  "name"                   VARCHAR(100) NOT NULL,
  "passwordResetToken"     TEXT,
  "passwordResetExpiresAt" TIMESTAMP(3),
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customers_email_key"                ON "customers"("email");
CREATE UNIQUE INDEX "customers_passwordResetToken_key"   ON "customers"("passwordResetToken");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "cleaners" (
  "id"           TEXT         NOT NULL,
  "email"        VARCHAR(254) NOT NULL,
  "passwordHash" TEXT         NOT NULL,
  "name"         VARCHAR(100) NOT NULL,
  "phone"        VARCHAR(30),
  "active"       BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cleaners_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cleaners_email_key" ON "cleaners"("email");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "recurring_schedules" (
  "id"           TEXT            NOT NULL,
  "name"         VARCHAR(100)    NOT NULL,
  "email"        VARCHAR(254)    NOT NULL,
  "phone"        VARCHAR(30)     NOT NULL,
  "address"      VARCHAR(300)    NOT NULL,
  "city"         VARCHAR(100)    NOT NULL,
  "state"        CHAR(2)         NOT NULL,
  "zip"          VARCHAR(10)     NOT NULL,
  "service"      "ServiceType"   NOT NULL,
  "frequency"    "Frequency"     NOT NULL,
  "propertySize" "PropertySize"  NOT NULL,
  "timeSlot"     "TimeSlot"      NOT NULL,
  "extras"       "Extra"[]       NOT NULL DEFAULT '{}',
  "notes"        TEXT,
  "marketing"    BOOLEAN         NOT NULL DEFAULT false,
  "baseTotal"    INTEGER         NOT NULL,
  "status"       "ScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recurring_schedules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "recurring_schedules_email_idx"  ON "recurring_schedules"("email");
CREATE INDEX "recurring_schedules_status_idx" ON "recurring_schedules"("status");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "bookings" (
  "id"                  TEXT            NOT NULL,
  "reference"           TEXT            NOT NULL,
  "name"                VARCHAR(100)    NOT NULL,
  "email"               VARCHAR(254)    NOT NULL,
  "phone"               VARCHAR(30)     NOT NULL,
  "address"             VARCHAR(300)    NOT NULL,
  "city"                VARCHAR(100)    NOT NULL,
  "state"               CHAR(2)         NOT NULL,
  "zip"                 VARCHAR(10)     NOT NULL,
  "service"             "ServiceType"   NOT NULL,
  "frequency"           "Frequency"     NOT NULL,
  "propertySize"        "PropertySize"  NOT NULL,
  "scheduledAt"         TIMESTAMP(3)    NOT NULL,
  "timeSlot"            "TimeSlot"      NOT NULL,
  "extras"              "Extra"[]       NOT NULL DEFAULT '{}',
  "notes"               TEXT,
  "adminNotes"          TEXT,
  "total"               INTEGER         NOT NULL,
  "status"              "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "stripeSessionId"     TEXT,
  "recurringScheduleId" TEXT,
  "cleanerId"           TEXT,
  "marketing"           BOOLEAN         NOT NULL DEFAULT false,
  "createdAt"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"           TIMESTAMP(3),
  "reminderSentAt"      TIMESTAMP(3),
  "reviewToken"         TEXT,
  "reviewInviteSentAt"  TIMESTAMP(3),
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bookings_recurringScheduleId_fkey"
    FOREIGN KEY ("recurringScheduleId") REFERENCES "recurring_schedules"("id") ON DELETE SET NULL,
  CONSTRAINT "bookings_cleanerId_fkey"
    FOREIGN KEY ("cleanerId") REFERENCES "cleaners"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX "bookings_reference_key"       ON "bookings"("reference");
CREATE UNIQUE INDEX "bookings_stripeSessionId_key" ON "bookings"("stripeSessionId");
CREATE UNIQUE INDEX "bookings_reviewToken_key"     ON "bookings"("reviewToken");
CREATE INDEX "bookings_email_idx"                  ON "bookings"("email");
CREATE INDEX "bookings_status_idx"                 ON "bookings"("status");
CREATE INDEX "bookings_scheduledAt_idx"            ON "bookings"("scheduledAt");
CREATE INDEX "bookings_recurringScheduleId_idx"    ON "bookings"("recurringScheduleId");
CREATE INDEX "bookings_cleanerId_idx"              ON "bookings"("cleanerId");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "reviews" (
  "id"        TEXT           NOT NULL,
  "bookingId" TEXT           NOT NULL,
  "name"      VARCHAR(100)   NOT NULL,
  "service"   "ServiceType"  NOT NULL,
  "rating"    INTEGER        NOT NULL,
  "title"     VARCHAR(200)   NOT NULL,
  "body"      TEXT           NOT NULL,
  "status"    "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reviews_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");
CREATE INDEX "reviews_status_idx"           ON "reviews"("status");
CREATE INDEX "reviews_createdAt_idx"        ON "reviews"("createdAt");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "contact_messages" (
  "id"        TEXT         NOT NULL,
  "name"      VARCHAR(100) NOT NULL,
  "email"     VARCHAR(254) NOT NULL,
  "phone"     VARCHAR(30),
  "subject"   VARCHAR(200) NOT NULL,
  "message"   TEXT         NOT NULL,
  "read"      BOOLEAN      NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "contact_messages_read_idx"      ON "contact_messages"("read");
CREATE INDEX "contact_messages_createdAt_idx" ON "contact_messages"("createdAt");

-- ─── 3. PRISMA MIGRATIONS TABLE ───────────────────────────────────────────────
-- Tells Prisma the migration has already been applied

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                   VARCHAR(36)  NOT NULL,
  "checksum"             VARCHAR(64)  NOT NULL,
  "finished_at"          TIMESTAMPTZ,
  "migration_name"       VARCHAR(255) NOT NULL,
  "logs"                 TEXT,
  "rolled_back_at"       TIMESTAMPTZ,
  "started_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "applied_steps_count"  INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","applied_steps_count")
VALUES (
  gen_random_uuid()::text,
  'manual-supabase-sql-setup',
  NOW(),
  '20260314000000_init',
  1
);

-- ─── 4. TEST DATA ─────────────────────────────────────────────────────────────

-- Admin account  (password: Admin@SparkleClean2025!)
INSERT INTO "admins" ("id","email","passwordHash","name","createdAt") VALUES (
  'ad000001-0000-0000-0000-000000000001',
  'admin@sparkleclean.com',
  '$2a$12$jLoFVyhT0Jii3f1ARV0zTe/3ZN1PMAzNE8V9JpkKhV/5cxTwRGh5S',
  'SparkleClean Admin',
  NOW()
);

-- Cleaners  (password: Cleaner123!)
INSERT INTO "cleaners" ("id","email","passwordHash","name","phone","active","createdAt","updatedAt") VALUES
(
  'cl000001-0000-0000-0000-000000000001',
  'alice@sparkleclean.com',
  '$2a$12$GsbapK50DTEshWntFgDtxuHG7BojEooHFr0xcK0SnnG6cLnHgnO4S',
  'Alice Johnson',
  '(555) 100-0001',
  true,
  NOW(), NOW()
),
(
  'cl000002-0000-0000-0000-000000000002',
  'bob@sparkleclean.com',
  '$2a$12$GsbapK50DTEshWntFgDtxuHG7BojEooHFr0xcK0SnnG6cLnHgnO4S',
  'Bob Martinez',
  '(555) 100-0002',
  true,
  NOW(), NOW()
);

-- Customers  (password: Customer123!)
INSERT INTO "customers" ("id","email","passwordHash","name","createdAt","updatedAt") VALUES
(
  'cu000001-0000-0000-0000-000000000001',
  'sarah.jones@example.com',
  '$2a$12$mwhAvIhYL9PMFVHxLmqXwOX0FDZLr9zrVdvyY4BaLPZkqGJoMaPya',
  'Sarah Jones',
  NOW(), NOW()
),
(
  'cu000002-0000-0000-0000-000000000002',
  'mike.taylor@example.com',
  '$2a$12$mwhAvIhYL9PMFVHxLmqXwOX0FDZLr9zrVdvyY4BaLPZkqGJoMaPya',
  'Mike Taylor',
  NOW(), NOW()
);

-- Recurring schedule (Sarah's weekly residential)
INSERT INTO "recurring_schedules"
  ("id","name","email","phone","address","city","state","zip",
   "service","frequency","propertySize","timeSlot","extras","baseTotal","status","createdAt","updatedAt")
VALUES (
  'rs000001-0000-0000-0000-000000000001',
  'Sarah Jones','sarah.jones@example.com','(555) 200-0001',
  '42 Maple Street','Springfield','IL','62701',
  'RESIDENTIAL','WEEKLY','MEDIUM','MORNING',
  ARRAY['WINDOWS']::"Extra"[],
  20000,
  'ACTIVE',
  NOW(), NOW()
);

-- ── Bookings ──────────────────────────────────────────────────────────────────

-- 1. COMPLETED — Sarah, residential (has review)
INSERT INTO "bookings"
  ("id","reference","name","email","phone","address","city","state","zip",
   "service","frequency","propertySize","scheduledAt","timeSlot","extras","notes",
   "total","status","cleanerId","recurringScheduleId","reviewToken","reviewInviteSentAt","createdAt","updatedAt")
VALUES (
  'bk000001-0000-0000-0000-000000000001',
  'SC-A1B2C3D4',
  'Sarah Jones','sarah.jones@example.com','(555) 200-0001',
  '42 Maple Street','Springfield','IL','62701',
  'RESIDENTIAL','WEEKLY','MEDIUM',
  NOW() - INTERVAL '14 days','MORNING',
  ARRAY['WINDOWS']::"Extra"[],
  'Please focus on the kitchen.',
  20000,'COMPLETED',
  'cl000001-0000-0000-0000-000000000001',
  'rs000001-0000-0000-0000-000000000001',
  'rvtoken1-0000-0000-0000-000000000001',
  NOW() - INTERVAL '13 days',
  NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'
);

-- 2. CONFIRMED — Sarah, upcoming this week (recurring)
INSERT INTO "bookings"
  ("id","reference","name","email","phone","address","city","state","zip",
   "service","frequency","propertySize","scheduledAt","timeSlot","extras",
   "total","status","cleanerId","recurringScheduleId","createdAt","updatedAt")
VALUES (
  'bk000002-0000-0000-0000-000000000002',
  'SC-B2C3D4E5',
  'Sarah Jones','sarah.jones@example.com','(555) 200-0001',
  '42 Maple Street','Springfield','IL','62701',
  'RESIDENTIAL','WEEKLY','MEDIUM',
  NOW() + INTERVAL '3 days','MORNING',
  ARRAY['WINDOWS']::"Extra"[],
  20000,'CONFIRMED',
  'cl000001-0000-0000-0000-000000000001',
  'rs000001-0000-0000-0000-000000000001',
  NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
);

-- 3. PENDING — Mike, deep clean, awaiting staff confirmation
INSERT INTO "bookings"
  ("id","reference","name","email","phone","address","city","state","zip",
   "service","frequency","propertySize","scheduledAt","timeSlot","extras","notes",
   "total","status","createdAt","updatedAt")
VALUES (
  'bk000003-0000-0000-0000-000000000003',
  'SC-C3D4E5F6',
  'Mike Taylor','mike.taylor@example.com','(555) 300-0002',
  '18 Oak Avenue','Chicago','IL','60601',
  'DEEP','ONE_TIME','LARGE',
  NOW() + INTERVAL '5 days','AFTERNOON',
  ARRAY['CARPETS','WINDOWS']::"Extra"[],
  'First time customer — move-out clean.',
  45000,'PENDING',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
);

-- 4. PENDING — Anonymous, commercial, no cleaner assigned
INSERT INTO "bookings"
  ("id","reference","name","email","phone","address","city","state","zip",
   "service","frequency","propertySize","scheduledAt","timeSlot","extras",
   "total","status","createdAt","updatedAt")
VALUES (
  'bk000004-0000-0000-0000-000000000004',
  'SC-D4E5F6G7',
  'Acme Corp','office@acmecorp.com','(555) 400-0001',
  '99 Business Park','Chicago','IL','60602',
  'COMMERCIAL','MONTHLY','LARGE',
  NOW() + INTERVAL '10 days','MORNING',
  '{}',
  25000,'PENDING',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
);

-- 5. CANCELLED — Mike, one-time residential
INSERT INTO "bookings"
  ("id","reference","name","email","phone","address","city","state","zip",
   "service","frequency","propertySize","scheduledAt","timeSlot","extras",
   "total","status","createdAt","updatedAt")
VALUES (
  'bk000005-0000-0000-0000-000000000005',
  'SC-E5F6G7H8',
  'Mike Taylor','mike.taylor@example.com','(555) 300-0002',
  '18 Oak Avenue','Chicago','IL','60601',
  'RESIDENTIAL','ONE_TIME','SMALL',
  NOW() - INTERVAL '5 days','EVENING',
  '{}',
  15000,'CANCELLED',
  NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'
);

-- 6. COMPLETED — Sarah, 4 weeks ago (older history)
INSERT INTO "bookings"
  ("id","reference","name","email","phone","address","city","state","zip",
   "service","frequency","propertySize","scheduledAt","timeSlot","extras",
   "total","status","cleanerId","recurringScheduleId","createdAt","updatedAt")
VALUES (
  'bk000006-0000-0000-0000-000000000006',
  'SC-F6G7H8I9',
  'Sarah Jones','sarah.jones@example.com','(555) 200-0001',
  '42 Maple Street','Springfield','IL','62701',
  'RESIDENTIAL','WEEKLY','MEDIUM',
  NOW() - INTERVAL '28 days','MORNING',
  ARRAY['WINDOWS']::"Extra"[],
  20000,'COMPLETED',
  'cl000002-0000-0000-0000-000000000002',
  'rs000001-0000-0000-0000-000000000001',
  NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'
);

-- 7. CONFIRMED — Bob assigned, specialized, next week
INSERT INTO "bookings"
  ("id","reference","name","email","phone","address","city","state","zip",
   "service","frequency","propertySize","scheduledAt","timeSlot","extras","notes",
   "total","status","cleanerId","createdAt","updatedAt")
VALUES (
  'bk000007-0000-0000-0000-000000000007',
  'SC-G7H8I9J0',
  'Linda Park','linda.park@example.com','(555) 500-0001',
  '7 Elm Court','Evanston','IL','60201',
  'SPECIALIZED','ONE_TIME','MEDIUM',
  NOW() + INTERVAL '7 days','AFTERNOON',
  ARRAY['ORGANIZATION','LAUNDRY']::"Extra"[],
  'Post-renovation clean.',
  35000,'CONFIRMED',
  'cl000002-0000-0000-0000-000000000002',
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
);

-- ── Reviews ───────────────────────────────────────────────────────────────────

-- Published review on booking #1
INSERT INTO "reviews"
  ("id","bookingId","name","service","rating","title","body","status","createdAt","updatedAt")
VALUES (
  'rv000001-0000-0000-0000-000000000001',
  'bk000001-0000-0000-0000-000000000001',
  'Sarah Jones','RESIDENTIAL',5,
  'Absolutely sparkling clean!',
  'The team arrived on time and did a fantastic job. Every surface was spotless. I especially loved how they handled the kitchen — it looked brand new. Highly recommend SparkleClean to anyone!',
  'PUBLISHED',
  NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days'
);

-- Published review on booking #6
INSERT INTO "reviews"
  ("id","bookingId","name","service","rating","title","body","status","createdAt","updatedAt")
VALUES (
  'rv000002-0000-0000-0000-000000000002',
  'bk000006-0000-0000-0000-000000000006',
  'Sarah Jones','RESIDENTIAL',4,
  'Great service, very thorough',
  'Very happy with the cleaning. They missed a small spot behind the fridge but everything else was perfect. Will definitely book again!',
  'PUBLISHED',
  NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'
);

-- Pending review (not yet moderated)
INSERT INTO "reviews"
  ("id","bookingId","name","service","rating","title","body","status","createdAt","updatedAt")
VALUES (
  'rv000003-0000-0000-0000-000000000003',
  'bk000007-0000-0000-0000-000000000007',
  'Linda Park','SPECIALIZED',5,
  'Best cleaning service in Chicago!',
  'I had a post-renovation mess and they tackled it brilliantly. Every corner was clean and they even organised my cupboards. Worth every penny!',
  'PENDING',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
);

-- ── Contact messages ──────────────────────────────────────────────────────────

INSERT INTO "contact_messages"
  ("id","name","email","phone","subject","message","read","createdAt")
VALUES
(
  'cm000001-0000-0000-0000-000000000001',
  'James Wilson','james.wilson@example.com','(555) 600-0001',
  'Pricing enquiry for office cleaning',
  'Hi, I run a small office of about 20 people and I am interested in monthly commercial cleaning. Could you please send me a quote? The space is roughly 2,000 sq ft.',
  false,
  NOW() - INTERVAL '6 hours'
),
(
  'cm000002-0000-0000-0000-000000000002',
  'Priya Sharma','priya.sharma@example.com',NULL,
  'Question about recurring bookings',
  'Hello, I would like to set up a weekly cleaning for my home but I need to skip the last week of each month. Is that possible? Also, do you use eco-friendly products?',
  false,
  NOW() - INTERVAL '2 days'
),
(
  'cm000003-0000-0000-0000-000000000003',
  'Tom Brady','tom.brady@example.com','(555) 700-0003',
  'Feedback — excellent service!',
  'Just wanted to say the team that came last Tuesday was absolutely brilliant. Left the house in perfect condition. Please pass on my compliments!',
  true,
  NOW() - INTERVAL '5 days'
);

-- ─── 5. VERIFY ────────────────────────────────────────────────────────────────
-- Run the queries below to confirm everything was inserted correctly:

SELECT 'admins'             AS "table", COUNT(*) AS "rows" FROM "admins"
UNION ALL
SELECT 'customers',          COUNT(*) FROM "customers"
UNION ALL
SELECT 'cleaners',           COUNT(*) FROM "cleaners"
UNION ALL
SELECT 'recurring_schedules',COUNT(*) FROM "recurring_schedules"
UNION ALL
SELECT 'bookings',           COUNT(*) FROM "bookings"
UNION ALL
SELECT 'reviews',            COUNT(*) FROM "reviews"
UNION ALL
SELECT 'contact_messages',   COUNT(*) FROM "contact_messages";
