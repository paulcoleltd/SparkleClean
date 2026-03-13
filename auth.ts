import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email as string },
        })
        if (!admin) return null

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

        const customer = await prisma.customer.findUnique({
          where: { email: credentials.email as string },
        })
        if (!customer) return null

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

        const cleaner = await prisma.cleaner.findUnique({
          where: { email: credentials.email as string },
        })
        if (!cleaner || !cleaner.active) return null

        const valid = await bcrypt.compare(credentials.password as string, cleaner.passwordHash)
        if (!valid) return null

        return { id: cleaner.id, email: cleaner.email, name: cleaner.name, role: 'cleaner' as const }
      },
    }),
  ],

  // No global signIn page — each area defines its own
  pages: { signIn: '/account/login' },

  session: { strategy: 'jwt' },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id ?? ''
        token.role = user.role
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

      // Admin area — must be signed in as admin
      if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        if (session?.user?.role !== 'admin') {
          return Response.redirect(new URL('/admin/login', request.url))
        }
      }

      // Customer account area — must be signed in (any role)
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

      // Cleaner portal — must be signed in as cleaner
      if (pathname.startsWith('/cleaner') && pathname !== '/cleaner/login') {
        if (session?.user?.role !== 'cleaner') {
          return Response.redirect(new URL('/cleaner/login', request.url))
        }
      }

      return true
    },
  },
})
