"""
SparkleClean — Release Notes PDF Generator
Run: python generate_release_notes.py
Output: SparkleClean_Release_Notes_v1.0.0.pdf
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import date

# ── Colour palette ──────────────────────────────────────────────────────────
BRAND      = colors.HexColor('#4CAF50')
BRAND_DARK = colors.HexColor('#388E3C')
BRAND_LIGHT= colors.HexColor('#E8F5E9')
DARK       = colors.HexColor('#1A1A1A')
GREY       = colors.HexColor('#6B7280')
LIGHT_GREY = colors.HexColor('#F3F4F6')
BORDER     = colors.HexColor('#E5E7EB')
RED        = colors.HexColor('#EF4444')
AMBER      = colors.HexColor('#F59E0B')
BLUE       = colors.HexColor('#3B82F6')
PURPLE     = colors.HexColor('#8B5CF6')
TEAL       = colors.HexColor('#0D9488')
WHITE      = colors.white

PAGE_W, PAGE_H = A4
MARGIN = 2 * cm

# ── Styles ───────────────────────────────────────────────────────────────────
base = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

styles = {
    'cover_title': S('cover_title',
        fontName='Helvetica-Bold', fontSize=36, textColor=WHITE,
        alignment=TA_CENTER, spaceAfter=8),
    'cover_sub': S('cover_sub',
        fontName='Helvetica', fontSize=16, textColor=WHITE,
        alignment=TA_CENTER, spaceAfter=6),
    'cover_meta': S('cover_meta',
        fontName='Helvetica', fontSize=11, textColor=colors.HexColor('#C8E6C9'),
        alignment=TA_CENTER, spaceAfter=4),
    'h1': S('h1',
        fontName='Helvetica-Bold', fontSize=20, textColor=BRAND_DARK,
        spaceBefore=18, spaceAfter=8, borderPadding=(0,0,4,0)),
    'h2': S('h2',
        fontName='Helvetica-Bold', fontSize=14, textColor=DARK,
        spaceBefore=14, spaceAfter=6),
    'h3': S('h3',
        fontName='Helvetica-Bold', fontSize=11, textColor=BRAND_DARK,
        spaceBefore=10, spaceAfter=4),
    'body': S('body',
        fontName='Helvetica', fontSize=10, textColor=DARK,
        leading=15, spaceAfter=4),
    'body_grey': S('body_grey',
        fontName='Helvetica', fontSize=9, textColor=GREY,
        leading=14, spaceAfter=3),
    'code': S('code',
        fontName='Courier', fontSize=9, textColor=colors.HexColor('#1F2937'),
        backColor=LIGHT_GREY, borderPadding=4,
        leading=13, spaceAfter=4),
    'bullet': S('bullet',
        fontName='Helvetica', fontSize=10, textColor=DARK,
        leading=15, spaceAfter=3, leftIndent=16, bulletIndent=4),
    'badge_green': S('badge_green',
        fontName='Helvetica-Bold', fontSize=9, textColor=WHITE,
        backColor=BRAND, alignment=TA_CENTER),
    'toc_entry': S('toc_entry',
        fontName='Helvetica', fontSize=10, textColor=DARK,
        leading=18, leftIndent=12),
    'toc_section': S('toc_section',
        fontName='Helvetica-Bold', fontSize=11, textColor=BRAND_DARK,
        leading=20),
    'footer': S('footer',
        fontName='Helvetica', fontSize=8, textColor=GREY,
        alignment=TA_CENTER),
    'tag': S('tag',
        fontName='Helvetica-Bold', fontSize=8, textColor=WHITE,
        backColor=BRAND, alignment=TA_CENTER),
}

# ── Helpers ─────────────────────────────────────────────────────────────────

def hr(color=BORDER, thickness=1, spaceB=6, spaceA=6):
    return HRFlowable(width='100%', thickness=thickness,
                      color=color, spaceAfter=spaceA, spaceBefore=spaceB)

def B(text): return f'<b>{text}</b>'
def I(text): return f'<i>{text}</i>'
def C(text, col): return f'<font color="{col}">{text}</font>'
def MONO(text): return f'<font name="Courier">{text}</font>'

def P(text, style='body'): return Paragraph(text, styles[style])

def bullet(items, indent=0):
    out = []
    for item in items:
        out.append(Paragraph(f'<bullet>&bull;</bullet> {item}', styles['bullet']))
    return out

def section_header(title, subtitle=None):
    items = [hr(BRAND, 2, 4, 2), P(title, 'h1')]
    if subtitle:
        items.append(P(subtitle, 'body_grey'))
    items.append(hr(BORDER, 0.5, 2, 8))
    return items

def kv_table(rows, col_widths=None):
    """Two-column key/value table."""
    if col_widths is None:
        col_widths = [5.5*cm, 11*cm]
    data = [[Paragraph(B(k), styles['body']), Paragraph(v, styles['body'])]
            for k, v in rows]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), LIGHT_GREY),
        ('TEXTCOLOR',  (0,0), (0,-1), BRAND_DARK),
        ('FONTNAME',   (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('PADDING',    (0,0), (-1,-1), 5),
        ('GRID',       (0,0), (-1,-1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [WHITE, LIGHT_GREY]),
        ('VALIGN',     (0,0), (-1,-1), 'TOP'),
    ]))
    return t

def feature_table(rows):
    """Feature status table: ID | Feature | Status"""
    header = [
        Paragraph(B('ID'),      styles['body']),
        Paragraph(B('Feature'), styles['body']),
        Paragraph(B('Status'),  styles['body']),
        Paragraph(B('Phase'),   styles['body']),
    ]
    data = [header]
    for feat_id, name, status, phase in rows:
        sc = BRAND if status == 'Complete' else AMBER if status == 'In Progress' else GREY
        data.append([
            Paragraph(MONO(feat_id), styles['body']),
            Paragraph(name, styles['body']),
            Paragraph(C(B(status), sc), styles['body']),
            Paragraph(str(phase), styles['body']),
        ])
    t = Table(data, colWidths=[2.2*cm, 8.5*cm, 2.8*cm, 2.2*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',  (0,0), (-1,0), BRAND_DARK),
        ('TEXTCOLOR',   (0,0), (-1,0), WHITE),
        ('FONTNAME',    (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0,0), (-1,-1), 9),
        ('PADDING',     (0,0), (-1,-1), 5),
        ('GRID',        (0,0), (-1,-1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ('VALIGN',      (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return t

def api_table(rows):
    """API route table: Method | Path | Auth | Description"""
    header = [
        Paragraph(B('Method'), styles['body']),
        Paragraph(B('Path'),   styles['body']),
        Paragraph(B('Auth'),   styles['body']),
        Paragraph(B('Description'), styles['body']),
    ]
    METHOD_COLORS = {
        'GET':    colors.HexColor('#22C55E'),
        'POST':   colors.HexColor('#3B82F6'),
        'PATCH':  colors.HexColor('#F59E0B'),
        'PUT':    colors.HexColor('#8B5CF6'),
        'DELETE': colors.HexColor('#EF4444'),
    }
    data = [header]
    for method, path, auth, desc in rows:
        mc = METHOD_COLORS.get(method, GREY)
        data.append([
            Paragraph(C(B(method), mc), styles['body']),
            Paragraph(MONO(path), styles['body']),
            Paragraph(auth, styles['body']),
            Paragraph(desc, styles['body']),
        ])
    t = Table(data, colWidths=[1.8*cm, 6.5*cm, 2*cm, 5.4*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK),
        ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
        ('FONTSIZE',   (0,0), (-1,-1), 8.5),
        ('PADDING',    (0,0), (-1,-1), 4),
        ('GRID',       (0,0), (-1,-1), 0.4, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ('VALIGN',     (0,0), (-1,-1), 'TOP'),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
    ]))
    return t

def env_table(rows):
    header = [Paragraph(B('Variable'), styles['body']),
              Paragraph(B('Required'), styles['body']),
              Paragraph(B('Description'), styles['body'])]
    data = [header]
    for var, req, desc in rows:
        rc = RED if req == 'Yes' else AMBER if req == 'Dev' else GREY
        data.append([
            Paragraph(MONO(var), styles['body']),
            Paragraph(C(B(req), rc), styles['body']),
            Paragraph(desc, styles['body']),
        ])
    t = Table(data, colWidths=[5.5*cm, 1.8*cm, 8.4*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK),
        ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
        ('FONTSIZE',   (0,0), (-1,-1), 8.5),
        ('PADDING',    (0,0), (-1,-1), 4),
        ('GRID',       (0,0), (-1,-1), 0.4, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ('VALIGN',     (0,0), (-1,-1), 'TOP'),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
    ]))
    return t

# ── Page number footer ───────────────────────────────────────────────────────

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(GREY)
    canvas.setFont('Helvetica', 8)
    canvas.drawCentredString(PAGE_W / 2, 1.2*cm,
        f'SparkleClean v1.0.0  —  Release Notes  —  Page {doc.page}')
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 1.6*cm, PAGE_W - MARGIN, 1.6*cm)
    canvas.restoreState()

# ── Cover page ───────────────────────────────────────────────────────────────

def cover_page():
    story = []

    # Green banner background via a table
    banner_data = [[
        Paragraph('SparkleClean', styles['cover_title']),
    ]]
    banner = Table(banner_data, colWidths=[PAGE_W - 2*MARGIN])
    banner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BRAND),
        ('PADDING',    (0,0), (-1,-1), 30),
        ('ALIGN',      (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(Spacer(1, 2*cm))
    story.append(banner)

    story.append(Spacer(1, 0.8*cm))
    story.append(P('Platform Release Notes', 'h1'))
    story.append(P('Version 1.0.0  —  Full Platform Release', 'h2'))
    story.append(hr(BRAND, 2))

    meta = [
        ('Release Date',    date.today().strftime('%d %B %Y')),
        ('Version',         '1.0.0'),
        ('Status',          'Production Ready'),
        ('Test Coverage',   '474 unit tests passing across 44 test files'),
        ('Architecture',    'Next.js 14 App Router · TypeScript · Prisma · PostgreSQL'),
        ('Deployment',      'Vercel (frontend + API) · Supabase (database)'),
    ]
    story.append(kv_table(meta))
    story.append(Spacer(1, 1*cm))

    story.append(P(
        'SparkleClean is a full-stack, production-grade cleaning company web platform '
        'built on Next.js 14. It covers the complete customer lifecycle — from online '
        'booking and Stripe payment through to cleaner assignment, automated reminders, '
        'review collection, and a rich admin dashboard. This document describes every '
        'feature, API endpoint, database model, environment variable, and local development '
        'procedure included in this release.',
        'body'
    ))
    story.append(PageBreak())
    return story

# ── Table of contents ────────────────────────────────────────────────────────

def toc():
    story = []
    story += section_header('Table of Contents')
    entries = [
        ('1.', 'Platform Overview'),
        ('2.', 'Technology Stack'),
        ('3.', 'Feature Inventory'),
        ('4.', 'Database Schema'),
        ('5.', 'API Reference'),
        ('6.', 'Pages & Routes'),
        ('7.', 'Email & SMS Notifications'),
        ('8.', 'Authentication & Roles'),
        ('9.', 'Local Development Setup'),
        ('10.', 'Environment Variables'),
        ('11.', 'Testing'),
        ('12.', 'Deployment'),
        ('13.', 'Security Notes'),
        ('14.', 'Known Limitations & Next Steps'),
    ]
    for num, title in entries:
        story.append(P(f'{B(num)}  {title}', 'toc_entry'))
    story.append(PageBreak())
    return story

# ── 1. Platform Overview ─────────────────────────────────────────────────────

def section_overview():
    story = []
    story += section_header('1. Platform Overview',
        'What SparkleClean is and who it serves')

    story.append(P(
        'SparkleClean is a multi-tenant booking and operations platform for a residential '
        'and commercial cleaning business. It replaces manual phone/email booking with a '
        'self-service web flow, integrates Stripe for payment, and provides a full admin '
        'back-office for day-to-day operations.',
        'body'
    ))
    story.append(Spacer(1, 0.3*cm))

    portal_data = [
        [Paragraph(B('Portal'), styles['body']),
         Paragraph(B('URL'), styles['body']),
         Paragraph(B('Audience'), styles['body']),
         Paragraph(B('Key Actions'), styles['body'])],
        [P('Public Website'), P(MONO('/')), P('Visitors'),
         P('Browse services, read about us, contact')],
        [P('Booking Flow'), P(MONO('/booking')), P('Customers'),
         P('Book & pay online, get confirmation email')],
        [P('Customer Account'), P(MONO('/account')), P('Registered customers'),
         P('View bookings, reschedule/cancel, referrals, reviews')],
        [P('Admin Panel'), P(MONO('/admin')), P('Staff / admins'),
         P('Full CRUD: bookings, cleaners, reviews, messages, promos, areas')],
        [P('Cleaner Portal'), P(MONO('/cleaner')), P('Field staff'),
         P('View assigned bookings, set weekly availability')],
    ]
    t = Table(portal_data, colWidths=[3.2*cm, 3*cm, 3*cm, 6.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',  (0,0), (-1,0), BRAND_DARK),
        ('TEXTCOLOR',   (0,0), (-1,0), WHITE),
        ('FONTNAME',    (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0,0), (-1,-1), 9),
        ('PADDING',     (0,0), (-1,-1), 5),
        ('GRID',        (0,0), (-1,-1), 0.4, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ('VALIGN',      (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t)
    story.append(PageBreak())
    return story

# ── 2. Technology Stack ──────────────────────────────────────────────────────

def section_stack():
    story = []
    story += section_header('2. Technology Stack')

    stack = [
        ('Framework',       'Next.js 14 — App Router, Server Components, Server Actions'),
        ('Language',        'TypeScript (strict mode throughout)'),
        ('Styling',         'TailwindCSS with custom brand tokens (brand-500 = #4CAF50)'),
        ('Database',        'PostgreSQL 16 via Prisma ORM — hosted on Supabase'),
        ('Authentication',  'NextAuth.js v5 (Credentials provider) — 3 roles: admin, customer, cleaner'),
        ('Payments',        'Stripe Checkout (redirect flow) + webhook for payment confirmation'),
        ('Email',           'Resend API with React Email templates'),
        ('SMS',             'Twilio (optional — graceful degradation if not configured)'),
        ('Validation',      'Zod at every API boundary — never trust client data'),
        ('Forms',           'React Hook Form + @hookform/resolvers/zod'),
        ('State',           'React Query for server state · useTransition for optimistic UI'),
        ('Rate limiting',   'In-memory LRU (dev) or Upstash Redis (production)'),
        ('Error monitoring','Sentry (optional — client, server, and edge configs included)'),
        ('Testing',         'Vitest (unit/integration) · Playwright (E2E)'),
        ('Package manager', 'npm (package-lock.json committed)'),
        ('Deployment',      'Vercel (frontend + API routes) · Supabase (managed PostgreSQL)'),
    ]
    story.append(kv_table(stack, [4.5*cm, 11.2*cm]))
    story.append(PageBreak())
    return story

# ── 3. Feature Inventory ─────────────────────────────────────────────────────

def section_features():
    story = []
    story += section_header('3. Feature Inventory',
        'All 39 feature IDs shipped in v1.0.0')

    features = [
        # Phase 1
        ('FEAT-001', 'Booking Confirmation Email',              'Complete', '1'),
        ('FEAT-002', 'Admin Dashboard + Booking List',          'Complete', '1'),
        ('FEAT-003', 'Admin Booking Detail & Status Update',    'Complete', '1'),
        ('FEAT-004', 'Contact Form',                            'Complete', '1'),
        ('FEAT-005', 'Admin Messages Inbox',                    'Complete', '1'),
        # Phase 2
        ('FEAT-006', 'Customer Account Registration',          'Complete', '2'),
        ('FEAT-007', 'Customer Login / Session',               'Complete', '2'),
        ('FEAT-008', 'Forgot / Reset Password (email token)',  'Complete', '2'),
        ('FEAT-009', 'Customer Booking History',               'Complete', '2'),
        ('FEAT-010', 'Booking Cancellation (customer)',        'Complete', '2'),
        ('FEAT-011', 'Booking Reschedule (customer)',          'Complete', '2'),
        ('FEAT-012', 'Pre-fill Booking Form for Logged-in User','Complete', '2'),
        ('FEAT-013', 'Stripe Checkout Integration',            'Complete', '2'),
        ('FEAT-014', 'Stripe Webhook (payment confirmation)',  'Complete', '2'),
        ('FEAT-015', 'Recurring Bookings (weekly/bi-weekly/monthly)', 'Complete', '2'),
        ('FEAT-016', 'Recurring Schedule Admin View',          'Complete', '2'),
        ('FEAT-017', 'Cancel Recurring Schedule',              'Complete', '2'),
        ('FEAT-018', 'Cleaner Portal (login + booking list)',  'Complete', '2'),
        ('FEAT-019', 'Admin Cleaner Management (CRUD)',        'Complete', '2'),
        ('FEAT-020', 'Assign Cleaner to Booking',              'Complete', '2'),
        ('FEAT-021', 'Cleaner Assignment Email',               'Complete', '2'),
        ('FEAT-022', 'Review Collection (token email link)',   'Complete', '2'),
        ('FEAT-023', 'Review Submission Form',                 'Complete', '2'),
        ('FEAT-024', 'Admin Review Moderation',                'Complete', '2'),
        ('FEAT-025', 'Admin Bulk Actions (status + delete)',   'Complete', '2'),
        ('FEAT-026', 'Admin Booking Export (CSV)',             'Complete', '2'),
        ('FEAT-027', 'Admin Booking Notes',                    'Complete', '2'),
        ('FEAT-028', 'Customer Profile Edit',                  'Complete', '2'),
        ('FEAT-029', 'Rate Limiting (all public endpoints)',   'Complete', '2'),
        ('FEAT-030', 'SEO (metadata, sitemap, OG images)',     'Complete', '2'),
        ('FEAT-031', 'Error Boundary + Sentry Integration',   'Complete', '2'),
        ('FEAT-032', '24-Hour Reminder Emails (cron job)',     'Complete', '2'),
        ('FEAT-033', 'Cleaner Assignment Notification Email',  'Complete', '2'),
        ('FEAT-034', 'Customer Referral Programme',           'Complete', '2'),
        # Phase 3
        ('FEAT-035', 'Admin Booking Calendar (week view)',     'Complete', '3'),
        ('FEAT-036', 'SMS Reminders via Twilio',               'Complete', '3'),
        ('FEAT-037', 'Promo Codes (PERCENTAGE + FIXED)',       'Complete', '3'),
        ('FEAT-038', 'Cleaner Availability Grid',              'Complete', '3'),
        ('FEAT-039', 'Service Area Management + Postcode Check','Complete', '3'),
    ]
    story.append(feature_table(features))
    story.append(PageBreak())
    return story

# ── 4. Database Schema ───────────────────────────────────────────────────────

def section_schema():
    story = []
    story += section_header('4. Database Schema',
        'PostgreSQL via Prisma ORM — all money stored in pence (Int), UUIDs as PKs')

    models = [
        ('Booking',              '71+ columns — core transaction record, FK to Cleaner, ReferralCode, PromoCode, RecurringSchedule'),
        ('Review',               'Rating (1–5), title, body, ReviewStatus (PENDING/PUBLISHED/REJECTED), token-based submission'),
        ('RecurringSchedule',    'Service config, ScheduleStatus (ACTIVE/PAUSED/CANCELLED), parent of Booking[]'),
        ('ContactMessage',       'Name, email, phone, subject, message, read flag'),
        ('Customer',             'Email (unique), bcrypt password hash, password reset token + expiry, FK to ReferralCode'),
        ('ReferralCode',         'Unique code (SC-XXXXXXXX), customer FK, usage count, FK to Booking[]'),
        ('Admin',                'Email (unique), bcrypt password hash, name'),
        ('Cleaner',              'Email (unique), bcrypt password hash, active flag, FK to Booking[], CleanerAvailability[]'),
        ('PromoCode',            'Code (unique), PERCENTAGE|FIXED type, discountValue (basis-pts or pence), maxUses, uses, active, expiresAt'),
        ('CleanerAvailability',  'cleanerId + dayOfWeek (@@unique), timeSlots TimeSlot[] — Mon-Sun x Morning/Afternoon/Evening'),
        ('ServiceArea',          'Name, postcodes String[] (prefix matching), active flag'),
    ]
    for model, desc in models:
        story.append(KeepTogether([
            P(B(model), 'h3'),
            P(desc, 'body'),
        ]))

    story.append(Spacer(1, 0.4*cm))
    story.append(P(B('Enums'), 'h2'))
    enum_data = [
        [Paragraph(B('Enum'), styles['body']), Paragraph(B('Values'), styles['body'])],
        [P('ServiceType'),    P('RESIDENTIAL · COMMERCIAL · DEEP · SPECIALIZED')],
        [P('Frequency'),      P('ONE_TIME · WEEKLY · BIWEEKLY · MONTHLY')],
        [P('PropertySize'),   P('SMALL (1-2 rooms) · MEDIUM (3-4 rooms) · LARGE (5+ rooms)')],
        [P('TimeSlot'),       P('MORNING (8am-12pm) · AFTERNOON (12pm-4pm) · EVENING (4pm-6pm)')],
        [P('Extra'),          P('WINDOWS · CARPETS · LAUNDRY · ORGANIZATION')],
        [P('BookingStatus'),  P('PENDING_PAYMENT · PENDING · CONFIRMED · COMPLETED · CANCELLED')],
        [P('ScheduleStatus'), P('ACTIVE · PAUSED · CANCELLED')],
        [P('ReviewStatus'),   P('PENDING · PUBLISHED · REJECTED')],
        [P('DiscountType'),   P('PERCENTAGE (basis-points) · FIXED (pence)')],
    ]
    t = Table(enum_data, colWidths=[4*cm, 11.7*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK),
        ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('PADDING',    (0,0), (-1,-1), 5),
        ('GRID',       (0,0), (-1,-1), 0.4, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(PageBreak())
    return story

# ── 5. API Reference ─────────────────────────────────────────────────────────

def section_api():
    story = []
    story += section_header('5. API Reference',
        'All routes are under /api. Auth = "Public" | "Customer" | "Cleaner" | "Admin" | "Webhook"')

    groups = [
        ('Booking (Public / Customer)', [
            ('POST',   '/api/bookings',                    'Public',   'Create booking, validate promo + referral, create Stripe Checkout'),
            ('GET',    '/api/bookings/:id',                'Customer', 'Get booking detail (owner only)'),
            ('POST',   '/api/bookings/:id/cancel',         'Customer', 'Cancel booking (>24h before scheduled time)'),
            ('POST',   '/api/bookings/:id/reschedule',     'Customer', 'Reschedule booking to new date/time slot'),
        ]),
        ('Authentication', [
            ('POST',   '/api/auth/[...nextauth]',          'Public',   'NextAuth.js credentials sign-in endpoint'),
            ('POST',   '/api/account/register',            'Public',   'Register new customer account'),
            ('POST',   '/api/account/forgot-password',     'Public',   'Issue password reset token, send email'),
            ('POST',   '/api/account/reset-password',      'Public',   'Consume reset token, update password'),
        ]),
        ('Customer Account', [
            ('GET',    '/api/account',                     'Customer', 'Get customer profile'),
            ('PATCH',  '/api/account/profile',             'Customer', 'Update name, phone'),
            ('GET',    '/api/account/referral',            'Customer', 'Get or create referral code + usage stats'),
        ]),
        ('Reviews', [
            ('POST',   '/api/reviews',                     'Public',   'Submit review via token (from email link)'),
            ('PATCH',  '/api/reviews/:id',                 'Public',   'Update review (within token validity)'),
        ]),
        ('Public Utilities', [
            ('POST',   '/api/contact',                     'Public',   'Submit contact form message'),
            ('GET',    '/api/referral/validate',           'Public',   'Validate referral code — rate limited 20/hr'),
            ('GET',    '/api/promo/validate',              'Public',   'Validate promo code — rate limited 20/hr'),
            ('GET',    '/api/service-areas/check',         'Public',   'Check if postcode is covered — rate limited 30/hr'),
        ]),
        ('Stripe', [
            ('POST',   '/api/stripe/webhook',              'Webhook',  'Stripe checkout.session.completed — confirms booking, sends email'),
        ]),
        ('Cron Jobs', [
            ('GET',    '/api/cron/reminders',              'Cron',     '24h reminder emails (+ SMS if Twilio configured). Secured by CRON_SECRET bearer token'),
        ]),
        ('Admin — Bookings', [
            ('GET',    '/api/admin/bookings',              'Admin',    'Paginated booking list with search + status filter'),
            ('GET',    '/api/admin/bookings/:id',          'Admin',    'Full booking detail'),
            ('PATCH',  '/api/admin/bookings/:id',          'Admin',    'Update status, assigned cleaner, admin notes'),
            ('POST',   '/api/admin/bookings/:id/assign',   'Admin',    'Assign cleaner — triggers assignment email'),
            ('PATCH',  '/api/admin/bookings/:id/notes',    'Admin',    'Save internal admin notes'),
            ('POST',   '/api/admin/bookings/bulk',         'Admin',    'Bulk status update or soft-delete'),
            ('GET',    '/api/admin/bookings/export',       'Admin',    'Export filtered bookings as CSV'),
        ]),
        ('Admin — Calendar', [
            ('GET',    '/api/admin/calendar',              'Admin',    'Bookings for a date range (max 42 days) — used by week calendar UI'),
        ]),
        ('Admin — Cleaners', [
            ('GET',    '/api/admin/cleaners',              'Admin',    'List all cleaners'),
            ('POST',   '/api/admin/cleaners',              'Admin',    'Create cleaner account'),
            ('GET',    '/api/admin/cleaners/:id/availability', 'Admin', 'Get cleaner weekly availability'),
            ('PUT',    '/api/admin/cleaners/:id/availability', 'Admin', 'Replace full weekly availability schedule'),
        ]),
        ('Admin — Promos', [
            ('GET',    '/api/admin/promos',                'Admin',    'List promo codes (paginated)'),
            ('POST',   '/api/admin/promos',                'Admin',    'Create new promo code'),
            ('PATCH',  '/api/admin/promos/:id',            'Admin',    'Toggle active status'),
            ('DELETE', '/api/admin/promos/:id',            'Admin',    'Delete promo code'),
        ]),
        ('Admin — Service Areas', [
            ('GET',    '/api/admin/service-areas',         'Admin',    'List all service areas'),
            ('POST',   '/api/admin/service-areas',         'Admin',    'Create service area with postcode prefixes'),
            ('PATCH',  '/api/admin/service-areas/:id',     'Admin',    'Update name / postcodes / active status'),
            ('DELETE', '/api/admin/service-areas/:id',     'Admin',    'Delete service area'),
        ]),
        ('Admin — Misc', [
            ('GET',    '/api/messages/:id',                'Admin',    'Get contact message detail + mark as read'),
            ('PATCH',  '/api/recurring/:id/cancel',        'Admin',    'Cancel a recurring schedule'),
        ]),
    ]

    for group_title, routes in groups:
        story.append(KeepTogether([
            P(group_title, 'h3'),
            api_table(routes),
            Spacer(1, 0.3*cm),
        ]))

    story.append(PageBreak())
    return story

# ── 6. Pages & Routes ────────────────────────────────────────────────────────

def section_pages():
    story = []
    story += section_header('6. Pages & Routes', 'Next.js App Router — all pages server-rendered by default')

    pages = [
        (B('Public'),),
        ('/', 'Home — hero, service cards, trust signals, CTA'),
        ('/about', 'About Us page'),
        ('/services', 'Services listing with pricing'),
        ('/contact', 'Contact form (rate-limited)'),
        ('/privacy', 'Privacy policy'),
        ('/terms', 'Terms of service'),
        ('/review/:token', 'Token-gated review submission form'),
        (B('Booking'),),
        ('/booking', 'Multi-section booking form — service, schedule, extras, referral + promo codes, postcode check'),
        ('/booking/success', 'Confirmation page after successful Stripe payment'),
        ('/booking/cancelled', 'Cancellation page'),
        ('/booking/:reference', 'Booking detail page (public reference link)'),
        (B('Customer Account'),),
        ('/account/register', 'Registration form'),
        ('/account/login', 'Customer login'),
        ('/account/forgot-password', 'Request reset email'),
        ('/account/reset-password/:token', 'Set new password via email token'),
        ('/account', 'Dashboard — recent bookings, quick links'),
        ('/account/profile', 'Edit name and phone'),
        ('/account/bookings', 'Full booking history with status badges'),
        ('/account/bookings/:id', 'Booking detail — cancel / reschedule CTAs'),
        ('/account/bookings/:id/reschedule', 'Reschedule form'),
        ('/account/referral', 'Shareable referral code + usage stats'),
        (B('Admin Panel'),),
        ('/admin', 'Dashboard — KPI cards (today bookings, revenue, pending, completed)'),
        ('/admin/bookings', 'Paginated booking list, search, filter, bulk actions, CSV export'),
        ('/admin/bookings/:id', 'Full detail + status change + cleaner assign + notes'),
        ('/admin/calendar', 'Weekly booking calendar — colour-coded by cleaner'),
        ('/admin/recurring', 'Recurring schedules list'),
        ('/admin/recurring/:id', 'Schedule detail + cancel'),
        ('/admin/cleaners', 'Cleaner list'),
        ('/admin/cleaners/new', 'Create cleaner account'),
        ('/admin/messages', 'Contact message inbox'),
        ('/admin/reviews', 'Review moderation (approve / reject)'),
        ('/admin/referrals', 'Referral stats — top referrers table'),
        ('/admin/promos', 'Promo code management — create, toggle active, delete'),
        ('/admin/service-areas', 'Service area management — postcode prefix lists'),
        ('/admin/login', 'Admin credentials login'),
        (B('Cleaner Portal'),),
        ('/cleaner/login', 'Cleaner credentials login'),
        ('/cleaner/bookings', 'Assigned bookings list'),
        ('/cleaner/availability', 'Weekly availability grid — 7 days x 3 slots'),
    ]

    data = []
    for row in pages:
        if len(row) == 1:
            data.append([Paragraph(row[0], styles['h3']), Paragraph('', styles['body'])])
        else:
            data.append([Paragraph(MONO(row[0]), styles['body']),
                         Paragraph(row[1], styles['body'])])

    t = Table(data, colWidths=[6*cm, 9.7*cm])
    t.setStyle(TableStyle([
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('PADDING',  (0,0), (-1,-1), 4),
        ('GRID',     (0,0), (-1,-1), 0.3, BORDER),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [WHITE, LIGHT_GREY]),
        ('VALIGN',   (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t)
    story.append(PageBreak())
    return story

# ── 7. Notifications ─────────────────────────────────────────────────────────

def section_notifications():
    story = []
    story += section_header('7. Email & SMS Notifications')

    story.append(P(B('Email (Resend + React Email)'), 'h2'))
    emails = [
        ('Booking Confirmation',    'Triggered by',  'Stripe webhook checkout.session.completed'),
        ('Password Reset',          'Triggered by',  'POST /api/account/forgot-password'),
        ('24h Reminder',            'Triggered by',  'GET /api/cron/reminders (cron job)'),
        ('Review Invite',           'Triggered by',  'Admin marks booking COMPLETED'),
        ('Cleaner Assignment',      'Triggered by',  'Admin assigns cleaner via /api/admin/bookings/:id/assign'),
    ]
    e_data = [[Paragraph(B('Template'), styles['body']),
               Paragraph(B('Trigger'), styles['body'])]]
    for name, _, trigger in emails:
        e_data.append([P(name), P(trigger)])
    t = Table(e_data, colWidths=[5*cm, 10.7*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BRAND_DARK),
        ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('PADDING',    (0,0), (-1,-1), 5),
        ('GRID',       (0,0), (-1,-1), 0.4, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.4*cm))

    story.append(P(
        B('Development override:') + '  Set ' + MONO('RESEND_DEV_TO') +
        ' to a comma-separated list of email addresses. All outbound emails are '
        'redirected to these addresses in non-production environments.',
        'body'
    ))
    story.append(Spacer(1, 0.4*cm))

    story.append(P(B('SMS (Twilio) — Optional'), 'h2'))
    story.append(P(
        'SMS reminders are sent alongside the 24h reminder email when all three Twilio '
        'environment variables (' + MONO('TWILIO_ACCOUNT_SID') + ', ' +
        MONO('TWILIO_AUTH_TOKEN') + ', ' + MONO('TWILIO_FROM_NUMBER') + ') are present. '
        'If any variable is missing the service returns ' + MONO('false') + ' silently — '
        'the cron job continues without SMS and reports ' + MONO('smsSent: 0') + ' in the '
        'response. No crash, no error in booking flow.',
        'body'
    ))
    story.append(PageBreak())
    return story

# ── 8. Authentication & Roles ────────────────────────────────────────────────

def section_auth():
    story = []
    story += section_header('8. Authentication & Roles')

    story.append(P(
        'NextAuth.js v5 with Credentials provider. Sessions are JWT-based. '
        'Three independent credential stores — each role has its own DB model and login page.',
        'body'
    ))
    story.append(Spacer(1, 0.3*cm))

    roles = [
        [Paragraph(B('Role'), styles['body']),
         Paragraph(B('Model'), styles['body']),
         Paragraph(B('Login URL'), styles['body']),
         Paragraph(B('Access'), styles['body'])],
        [P('admin'),    P('Admin'),    P(MONO('/admin/login')),   P('Full admin panel — all data, all actions')],
        [P('customer'), P('Customer'), P(MONO('/account/login')), P('Own bookings, profile, referral code, review submission')],
        [P('cleaner'),  P('Cleaner'),  P(MONO('/cleaner/login')), P('Assigned bookings (read-only), own availability (read-write)')],
    ]
    t = Table(roles, colWidths=[2.2*cm, 2.5*cm, 3.5*cm, 7.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK),
        ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('PADDING',    (0,0), (-1,-1), 5),
        ('GRID',       (0,0), (-1,-1), 0.4, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.4*cm))

    story.append(P(B('Route Protection'), 'h2'))
    story += bullet([
        'Middleware (' + MONO('middleware.ts') + ') — blocks unauthenticated access to ' + MONO('/admin/*') + ', ' + MONO('/account/*') + ', ' + MONO('/cleaner/*'),
        'API routes check session role server-side — 401 for missing session, 403 for wrong role',
        'Admin pages additionally redirect to ' + MONO('/admin/login') + ' if role !== "admin"',
        'Passwords hashed with bcryptjs (cost factor 12)',
        'Password reset tokens are single-use UUIDs that expire after 1 hour',
    ])
    story.append(PageBreak())
    return story

# ── 9. Local Development Setup ────────────────────────────────────────────────

def section_local_dev():
    story = []
    story += section_header('9. Local Development Setup',
        'Full E2E testable on any machine — no registered domain required')

    steps = [
        ('Step 1 — Prerequisites',
         'Node.js 20+, npm, Git, Docker Desktop (for local PostgreSQL)'),
        ('Step 2 — Clone & install',
         MONO('git clone <repo> && cd CleaningCompanyApp && npm install')),
        ('Step 3 — Start database',
         MONO('docker compose up -d') + '  — starts PostgreSQL 16 on port 5433'),
        ('Step 4 — Environment',
         MONO('cp .env.example .env.local') + ' and fill in values (see section 10). For local dev, only DATABASE_URL, DIRECT_URL, AUTH_SECRET, RESEND_API_KEY, STRIPE_SECRET_KEY, and STRIPE_WEBHOOK_SECRET are required.'),
        ('Step 5 — Migrate & seed',
         MONO('npx prisma migrate dev --name init && npx prisma db seed') + '  — creates all tables and seeds the admin account'),
        ('Step 6 — Start dev server',
         MONO('npm run dev') + '  — starts on http://localhost:3000'),
        ('Step 7 — Stripe webhook (optional)',
         MONO('stripe listen --forward-to localhost:3000/api/stripe/webhook') + '  — required for end-to-end payment testing'),
        ('Step 8 — Email testing',
         'Set ' + MONO('RESEND_DEV_TO="your@email.com"') + ' — all emails redirect to that address. Or use Resend\'s ' + MONO('onboarding@resend.dev') + ' sender (no domain verification needed).'),
    ]

    for title, detail in steps:
        story.append(KeepTogether([
            P(B(title), 'h3'),
            P(detail, 'body'),
            Spacer(1, 0.2*cm),
        ]))

    story.append(P(B('Available npm scripts'), 'h2'))
    scripts = [
        [Paragraph(B('Script'), styles['body']),     Paragraph(B('Command'), styles['body']),      Paragraph(B('Description'), styles['body'])],
        [P('dev'),               P(MONO('npm run dev')),              P('Start Next.js dev server with HMR')],
        [P('build'),             P(MONO('npm run build')),            P('Production build (runs prisma generate)')],
        [P('start'),             P(MONO('npm start')),                P('Start production server')],
        [P('test'),              P(MONO('npm run test')),             P('Vitest unit tests (watch mode)')],
        [P('test:run'),          P(MONO('npm run test:run')),         P('Vitest unit tests (single run, CI mode)')],
        [P('test:e2e'),          P(MONO('npm run test:e2e')),         P('Playwright E2E tests (headless)')],
        [P('test:e2e:ui'),       P(MONO('npm run test:e2e:ui')),      P('Playwright E2E tests with interactive UI')],
        [P('docker:up'),         P(MONO('npm run docker:up')),        P('Start local PostgreSQL container')],
        [P('docker:down'),       P(MONO('npm run docker:down')),      P('Stop and remove PostgreSQL container')],
    ]
    t = Table(scripts, colWidths=[2.8*cm, 5.5*cm, 7.4*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK),
        ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('PADDING',    (0,0), (-1,-1), 5),
        ('GRID',       (0,0), (-1,-1), 0.4, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
    ]))
    story.append(t)
    story.append(PageBreak())
    return story

# ── 10. Environment Variables ─────────────────────────────────────────────────

def section_env():
    story = []
    story += section_header('10. Environment Variables',
        'Required = Yes (app fails without it) | Dev = only needed for full local testing | No = optional enhancement')

    envs = [
        ('DATABASE_URL',                    'Yes', 'Supabase connection string (port 6543, PgBouncer)'),
        ('DIRECT_URL',                      'Yes', 'Direct Supabase connection for Prisma migrations (port 5432)'),
        ('RESEND_API_KEY',                  'Yes', 'Resend API key — emails will not send without this'),
        ('RESEND_FROM_EMAIL',               'Yes', 'From address. Use onboarding@resend.dev until domain verified'),
        ('RESEND_DEV_TO',                   'Dev', 'Comma-separated override recipients — all emails go here in dev'),
        ('AUTH_SECRET',                     'Yes', 'NextAuth.js JWT signing secret — generate with openssl rand -base64 32'),
        ('AUTH_URL',                        'Yes', 'Canonical app URL e.g. http://localhost:3000'),
        ('ADMIN_SEED_PASSWORD',             'Dev', 'Initial admin password for prisma/seed.ts — remove after seeding in prod'),
        ('NEXT_PUBLIC_SITE_URL',            'Yes', 'Used in Stripe success/cancel redirect URLs'),
        ('NEXT_PUBLIC_COMPANY_NAME',        'No',  'Company name shown in UI and emails'),
        ('NEXT_PUBLIC_COMPANY_EMAIL',       'No',  'Public contact email shown in footer'),
        ('NEXT_PUBLIC_COMPANY_PHONE',       'No',  'Public phone number shown in footer'),
        ('CRON_SECRET',                     'Yes', 'Bearer token used to secure /api/cron/reminders'),
        ('STRIPE_SECRET_KEY',               'Yes', 'Stripe secret key (sk_test_... for dev, sk_live_... for prod)'),
        ('STRIPE_WEBHOOK_SECRET',           'Dev', 'Stripe webhook signing secret — required for payment confirmation'),
        ('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'No', 'Stripe public key (reserved for future client-side use)'),
        ('TWILIO_ACCOUNT_SID',              'No',  'Twilio account SID — leave empty to disable SMS'),
        ('TWILIO_AUTH_TOKEN',               'No',  'Twilio auth token'),
        ('TWILIO_FROM_NUMBER',              'No',  'Twilio phone number or messaging service SID'),
        ('UPSTASH_REDIS_REST_URL',          'No',  'Upstash Redis URL — use in-memory rate limiter if absent'),
        ('UPSTASH_REDIS_REST_TOKEN',        'No',  'Upstash Redis token'),
        ('SENTRY_DSN',                      'No',  'Sentry DSN for server-side error reporting'),
        ('NEXT_PUBLIC_SENTRY_DSN',          'No',  'Sentry DSN for client-side error reporting'),
        ('SENTRY_AUTH_TOKEN',               'No',  'Sentry auth token for source map upload in CI'),
        ('SENTRY_ORG',                      'No',  'Sentry organisation slug'),
        ('SENTRY_PROJECT',                  'No',  'Sentry project slug'),
    ]
    story.append(env_table(envs))
    story.append(PageBreak())
    return story

# ── 11. Testing ──────────────────────────────────────────────────────────────

def section_testing():
    story = []
    story += section_header('11. Testing')

    story.append(P(B('Unit & Integration Tests — Vitest'), 'h2'))
    story.append(P(
        '474 tests across 44 test files. All tests run in the Node environment '
        '(jsdom opt-in per file). Prisma, Resend, Twilio, and Stripe are mocked — '
        'no live services needed to run the unit suite.',
        'body'
    ))
    story.append(Spacer(1, 0.3*cm))

    coverage = [
        [Paragraph(B('Service / Module'), styles['body']),
         Paragraph(B('Tests'), styles['body']),
         Paragraph(B('What is covered'), styles['body'])],
        [P('bookingService'),       P('16'),  P('calculateTotal, calculateDiscount, frequency discounts, extras pricing')],
        [P('recurringService'),     P('12'),  P('nextOccurrence, schedule generation, ONE_TIME guard')],
        [P('reminderService'),      P('8'),   P('Email send, SMS delegation, per-booking error isolation, update tracking')],
        [P('reviewService'),        P('10'),  P('Token validation, rating bounds, status transitions')],
        [P('referralService'),      P('8'),   P('Discount calculation, cap enforcement, code normalisation')],
        [P('dashboardService'),     P('12'),  P('KPI aggregations, date filtering, revenue calculations')],
        [P('cleanerService'),       P('14'),  P('CRUD, password hash, cleaner assignment')],
        [P('customerService'),      P('13'),  P('canCustomerCancel rules — status + time window checks')],
        [P('contactService'),       P('6'),   P('Creation, read flag, pagination')],
        [P('emailService'),         P('8'),   P('devTo() redirect, multi-address support, env fallback')],
        [P('promoService'),         P('11'),  P('calculatePromoDiscount (pure), validatePromoCode with all edge cases')],
        [P('serviceAreaService'),   P('10'),  P('normalisePostcode (pure), isPostcodeServiced prefix matching')],
        [P('availabilityService'),  P('6'),   P('getCleanerAvailability 7-day fill, setDayAvailability, setFullAvailability')],
        [P('smsService'),           P('2'),   P('Graceful degradation — returns false when Twilio not configured')],
        [P('API: /admin/calendar'), P('10'),  P('Auth, date range validation, 42-day cap, happy path')],
        [P('API: /promo/validate'), P('5'),   P('Missing params, valid/invalid code, default total')],
        [P('API: /service-areas/check'), P('4'), P('Missing param, serviced, not serviced, trim')],
        [P('API: various others'),  P('319+'), P('Auth guards, validation, error handling across all API routes')],
    ]
    t = Table(coverage, colWidths=[4.5*cm, 1.5*cm, 9.7*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BRAND_DARK),
        ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('PADDING',    (0,0), (-1,-1), 5),
        ('GRID',       (0,0), (-1,-1), 0.4, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
        ('VALIGN',     (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5*cm))

    story.append(P(B('E2E Tests — Playwright'), 'h2'))
    story.append(P(
        'E2E tests run against a local Docker PostgreSQL instance. The global setup '
        '(' + MONO('e2e/global-setup.ts') + ') automatically runs ' +
        MONO('prisma migrate deploy') + ' and seeds test data before the suite. '
        'Admin authentication state is saved to ' + MONO('.auth/admin.json') +
        ' by ' + MONO('e2e/auth.setup.ts') + ' and reused across authenticated tests.',
        'body'
    ))
    e2e = [
        [Paragraph(B('Spec File'), styles['body']),
         Paragraph(B('Tests'), styles['body']),
         Paragraph(B('Covers'), styles['body'])],
        [P('contact.spec.ts'),            P('6'),   P('Form rendering, validation, success/error states, mobile')],
        [P('account.spec.ts'),            P('10'),  P('Registration, login, password reset, auth redirects')],
        [P('admin-authenticated.spec.ts'),P('15+'), P('Dashboard, bookings, cleaners, messages, reviews, referrals, sign-out')],
        [P('calendar.spec.ts'),           P('7'),   P('Grid render, prev/next/today navigation, booking card, legend, mobile')],
    ]
    t2 = Table(e2e, colWidths=[5.5*cm, 1.5*cm, 8.7*cm])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK),
        ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('PADDING',    (0,0), (-1,-1), 5),
        ('GRID',       (0,0), (-1,-1), 0.4, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
    ]))
    story.append(t2)
    story.append(Spacer(1, 0.3*cm))
    story.append(P(
        B('Run all tests: ') + MONO('npm run test:run') +
        '  (unit)   |   ' + MONO('npm run test:e2e') + '  (E2E — requires Docker)',
        'body'
    ))
    story.append(PageBreak())
    return story

# ── 12. Deployment ───────────────────────────────────────────────────────────

def section_deployment():
    story = []
    story += section_header('12. Deployment', 'Vercel + Supabase')

    steps = [
        ('Database', 'Create a Supabase project. Copy the Transaction Mode (port 6543) connection string to DATABASE_URL and the direct connection string (port 5432) to DIRECT_URL.'),
        ('Run migrations', MONO('npx prisma migrate deploy') + ' — applies all migrations to Supabase. Run from CI or local machine with DIRECT_URL set.'),
        ('Seed admin', MONO('npx prisma db seed') + ' — creates the initial admin account using ADMIN_SEED_PASSWORD. Delete this env var after seeding.'),
        ('Vercel project', 'Import the GitHub repository in Vercel. Set Framework Preset to Next.js. All environment variables must be added in Vercel dashboard → Settings → Environment Variables.'),
        ('Stripe webhook', 'Add a webhook in the Stripe dashboard pointing to https://yourdomain.com/api/stripe/webhook. Add checkout.session.completed event. Copy the signing secret to STRIPE_WEBHOOK_SECRET.'),
        ('Cron job', 'Add a Vercel Cron Job in vercel.json calling GET /api/cron/reminders at the desired schedule (e.g. daily at 8am). Vercel injects the Authorization: Bearer <CRON_SECRET> header automatically.'),
        ('Domain & email', 'Point your domain to Vercel. Verify the domain in Resend dashboard to enable sending from bookings@yourdomain.com. Update RESEND_FROM_EMAIL and NEXT_PUBLIC_SITE_URL accordingly.'),
        ('Twilio (optional)', 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER to Vercel env vars. SMS reminders activate automatically.'),
        ('Upstash (recommended)', 'Create an Upstash Redis database and add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. This enables distributed rate limiting across multiple serverless instances.'),
    ]
    for title, detail in steps:
        story.append(KeepTogether([
            P(B(title), 'h3'),
            P(detail, 'body'),
            Spacer(1, 0.15*cm),
        ]))

    story.append(PageBreak())
    return story

# ── 13. Security Notes ───────────────────────────────────────────────────────

def section_security():
    story = []
    story += section_header('13. Security Notes')

    items = [
        B('Server-side total recalculation:') + ' The client never determines the booking price. POST /api/bookings always recalculates from service + extras + frequency + referral + promo on the server.',
        B('Stripe idempotency:') + ' Booking status is only set to PENDING (paid) when the Stripe webhook checkout.session.completed event arrives with a valid signature. Stripe-Signature header is verified on every webhook call.',
        B('Zod validation at every boundary:') + ' All API route handlers parse and validate the request body with Zod before touching the database. Invalid input returns 400 with structured error messages.',
        B('Role checks in API routes:') + ' Every admin route calls auth() and checks session?.user?.role === "admin". Customer routes check ownership. Cleaner routes check role === "cleaner".',
        B('Rate limiting:') + ' Public endpoints (booking form, promo/referral validate, contact, service area check, password reset) are rate-limited. In-memory LRU in dev; Upstash Redis in production.',
        B('Soft deletes:') + ' Bookings are never hard-deleted — the deletedAt timestamp is set and they are excluded from all queries by default.',
        B('Secrets never hardcoded:') + ' All credentials are loaded from environment variables. .env.local is git-ignored. .env.example contains only placeholder strings.',
        B('Password security:') + ' bcryptjs with cost factor 12. Reset tokens are single-use UUIDs that expire after 1 hour.',
        B('CSP (Content Security Policy):') + ' Configured in next.config.mjs. Nonce-based inline script handling for Next.js HMR in development.',
        B('Sentry:') + ' Error monitoring configured for client, server, and edge runtimes. Source maps uploaded during CI builds. No PII sent to Sentry by default.',
        B('Admin notes:') + ' adminNotes field is never exposed to customer-facing API responses — only returned in admin-authenticated routes.',
    ]
    story += bullet(items)
    story.append(PageBreak())
    return story

# ── 14. Known Limitations & Next Steps ───────────────────────────────────────

def section_next_steps():
    story = []
    story += section_header('14. Known Limitations & Next Steps')

    story.append(P(B('Known Limitations'), 'h2'))
    limitations = [
        'No real-time availability checking — time slots are not blocked when multiple customers book the same slot simultaneously.',
        'Payment is not refunded automatically on cancellation — staff must process refunds manually in Stripe dashboard.',
        'Cleaner availability is advisory only — the booking form does not filter time slots based on available cleaners.',
        'SMS sending is fire-and-forget from the cron job — failed SMS attempts are logged to console but not retried.',
        'No rate limiting on the admin API routes — protected by auth only.',
    ]
    story += bullet(limitations)
    story.append(Spacer(1, 0.4*cm))

    story.append(P(B('Suggested Phase 4 Features'), 'h2'))
    phase4 = [
        'Real-time slot availability — block double-bookings at the DB level with a unique constraint on (scheduledAt, cleanerId)',
        'Stripe refund automation on cancellation via the Stripe Refunds API',
        'Customer-facing availability calendar — show only slots where an active cleaner is free',
        'Push notifications (Web Push API) for booking status changes',
        'Multi-location / franchise support — service areas per cleaner',
        'Analytics dashboard — revenue trend, top services, busiest days',
        'Mobile app (React Native) using the existing REST API',
        'GDPR data export / deletion endpoint for customer account',
    ]
    story += bullet(phase4)
    story.append(Spacer(1, 0.6*cm))

    story.append(hr(BRAND, 2))
    story.append(Spacer(1, 0.3*cm))
    story.append(P(
        f'SparkleClean v1.0.0  —  Generated {date.today().strftime("%d %B %Y")}  —  '
        '474 tests passing  —  39 features complete',
        'footer'
    ))
    return story

# ── Build PDF ─────────────────────────────────────────────────────────────────

def build():
    output_path = r'C:\Users\Dell\CleaningCompanyApp\SparkleClean_Release_Notes_v1.0.0.pdf'

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=2*cm,
        title='SparkleClean v1.0.0 — Release Notes',
        author='SparkleClean Engineering',
        subject='Platform Release Notes',
    )

    story = []
    story += cover_page()
    story += toc()
    story += section_overview()
    story += section_stack()
    story += section_features()
    story += section_schema()
    story += section_api()
    story += section_pages()
    story += section_notifications()
    story += section_auth()
    story += section_local_dev()
    story += section_env()
    story += section_testing()
    story += section_deployment()
    story += section_security()
    story += section_next_steps()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f'PDF generated: {output_path}')

if __name__ == '__main__':
    build()
