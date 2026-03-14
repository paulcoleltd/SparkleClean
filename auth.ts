import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// ─── Constant-time auth guard ─────────────────────────────────────────────────
// Pre-compute a dummy bcrypt hash at module startup (once, ~250 ms, cached).
// Equalises response time when user not found — prevents timing-based email
// enumeration (MITRE ATT&CK T1589.002).
const DUMMY_HASH_PROMISE = bcrypt.hash('__sparkle_auth_dummy_no_match__', 12)

// ─── Session re-validation ────────────────────────────────────────────────────
// Periodically verify the JWT subject still exists in the DB.
// Deleted or deactivated accounts lose access within RECHECK_MS.
const RECHECK_MS = 5 * 60_000 // 5 minutes

async function verifyUserExists(id: string, role: string): Promise<boolean> {
  try {
    if (role === 'admin') {
      return !!(await prisma.admin.findUnique({ where: { id }, select: { id: true } }))
    }
    if (role === 'customer') {
      return !!(await prisma.customer.findUnique({ where: { id }, select: { id: true } }))
    }
    if (role === 'cleaner') {
      const c = await prisma.cleaner.findUnique({ where: { id }, select: { id: true, active: true } })
      return !!(c?.active)
    }
    return false
  } catch {
    // Fail open on transient DB errors — avoids logging out all users during an outage
    return true
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // ── Admin login ──────────────────────────────────────────────────────────
    Credentials({
      id: 'admin-credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const dummyHash = await DUMMY_HASH_PROMISE
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email as string },
        })

        // Always run bcrypt — equalises timing regardless of whether user exists
        if (!admin) {
          await bcrypt.compare(credentials.password as string, dummyHash)
          return null
        }

        const valid = await bcrypt.compare(credentials.password as string, admin.passwordHash)
        if (!valid) return null

        return { id: admin.id, email: admin.email, name: admin.name, role: 'admin' as const }
      },
    }),

    // ── Customer login ───────────────────────────────────────────────────────
    Credentials({
      id: 'customer-credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const dummyHash = await DUMMY_HASH_PROMISE
        const customer = await prisma.customer.findUnique({
          where: { email: credentials.email as string },
        })

        if (!customer) {
          await bcrypt.compare(credentials.password as string, dummyHash)
          return null
        }

        const valid = await bcrypt.compare(credentials.password as string, customer.passwordHash)
        if (!valid) return null

        return { id: customer.id, email: customer.email, name: customer.name, role: 'customer' as const }
      },
    }),

    // ── Cleaner (field staff) login ──────────────────────────────────────────
    Credentials({
      id: 'cleaner-credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const dummyHash = await DUMMY_HASH_PROMISE
        const cleaner = await prisma.cleaner.findUnique({
          where: { email: credentials.email as string },
        })

        if (!cleaner || !cleaner.active) {
          await bcrypt.compare(credentials.password as string, dummyHash)
          return null
        }

        const valid = await bcrypt.compare(credentials.password as string, cleaner.passwordHash)
        if (!valid) return null

        return { id: cleaner.id, email: cleaner.email, name: cleaner.name, role: 'cleaner' as const }
      },
    }),
  ],

  pages: { signIn: '/account/login' },

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in — embed role and freshness timestamp into the JWT
      if (user) {
        token.id        = user.id ?? ''
        token.role      = user.role
        token.checkedAt = Date.now()
        return token
      }

      // Periodic re-validation: confirm user still exists every 5 minutes.
      // Returns null to invalidate the session if user was deleted or deactivated.
      const checkedAt = (token.checkedAt as number) ?? 0
      if (Date.now() - checkedAt > RECHECK_MS) {
        const exists = await verifyUserExists(token.id as string, token.role as string)
        if (!exists) return null
        token.checkedAt = Date.now()
      }

      return token
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id
        session.user.role = token.role
      }
      return session
    },

    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl

      if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        if (session?.user?.role !== 'admin') {
          return Response.redirect(new URL('/admin/login', request.url))
        }
      }

      const publicAccountPaths = [
        '/account/login',
        '/account/register',
        '/account/forgot-password',
      ]
      const isPublicAccountPath =
        publicAccountPaths.includes(pathname) ||
        pathname.startsWith('/account/reset-password/')

      if (pathname.startsWith('/account') && !isPublicAccountPath) {
        if (!session?.user) {
          return Response.redirect(new URL('/account/login', request.url))
        }
      }

      if (pathname.startsWith('/cleaner') && pathname !== '/cleaner/login') {
        if (session?.user?.role !== 'cleaner') {
          return Response.redirect(new URL('/cleaner/login', request.url))
        }
      }

      return true
    },
  },
})
