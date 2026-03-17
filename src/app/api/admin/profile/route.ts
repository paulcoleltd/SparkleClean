import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

const PatchSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(12, 'New password must be at least 12 characters'),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body   = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = await prisma.admin.findUnique({ where: { id: session.user.id } })
  if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

  const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: newHash } })

  return NextResponse.json({ ok: true })
}
