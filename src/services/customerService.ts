import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function createCustomer(name: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12)
  return prisma.customer.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true, name: true, createdAt: true },
  })
}

export async function getCustomerByEmail(email: string) {
  return prisma.customer.findUnique({ where: { email } })
}

/** Bookings linked to this customer by email — guest bookings are included */
export async function getBookingsByEmail(email: string) {
  return prisma.booking.findMany({
    where:   { email, deletedAt: null },
    orderBy: { scheduledAt: 'desc' },
    select: {
      id: true, reference: true, service: true, scheduledAt: true,
      timeSlot: true, status: true, total: true, extras: true,
      address: true, city: true, county: true, postcode: true, phone: true,
      recurringScheduleId: true,
    },
  })
}

export async function updateCustomerProfile(
  id: string,
  data: { name?: string; password?: string }
) {
  const update: { name?: string; passwordHash?: string } = {}
  if (data.name)     update.name         = data.name
  if (data.password) update.passwordHash = await bcrypt.hash(data.password, 12)
  return prisma.customer.update({
    where:  { id },
    data:   update,
    select: { id: true, email: true, name: true },
  })
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where:  { id },
    select: { id: true, email: true, name: true, createdAt: true },
  })
}

export async function verifyCustomerPassword(id: string, password: string): Promise<boolean> {
  const customer = await prisma.customer.findUnique({ where: { id } })
  if (!customer) return false
  return bcrypt.compare(password, customer.passwordHash)
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const customer = await prisma.customer.findUnique({ where: { email } })
  if (!customer) return null // do not reveal whether account exists

  const { randomUUID } = await import('crypto')
  const token     = randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.customer.update({
    where: { email },
    data:  { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
  })

  return token
}

export async function resetPasswordWithToken(
  token:    string,
  password: string
): Promise<boolean> {
  const customer = await prisma.customer.findUnique({ where: { passwordResetToken: token } })

  if (
    !customer ||
    !customer.passwordResetExpiresAt ||
    customer.passwordResetExpiresAt < new Date()
  ) {
    return false
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.customer.update({
    where: { id: customer.id },
    data:  { passwordHash, passwordResetToken: null, passwordResetExpiresAt: null },
  })

  return true
}

/** A customer may cancel if scheduled ≥ 24 hours from now and status allows it */
export function canCustomerCancel(scheduledAt: Date, status: string): boolean {
  const cancellable = ['PENDING_PAYMENT', 'PENDING', 'CONFIRMED']
  if (!cancellable.includes(status)) return false
  const hoursUntil = (scheduledAt.getTime() - Date.now()) / 3_600_000
  return hoursUntil >= 24
}
