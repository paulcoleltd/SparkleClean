import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '../../../../../../auth'
import { Resend } from 'resend'
import { getMessageById, markMessageRead } from '@/services/contactService'

const BodySchema = z.object({
  replyText: z.string().min(1).max(5000),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = await params
  const message = await getMessageById(id)
  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  const body   = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const resend     = new Resend(process.env.RESEND_API_KEY)
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
  const FROM       = `SparkleClean <${FROM_EMAIL}>`
  const devTo      = process.env.RESEND_DEV_TO ?? message.email

  await resend.emails.send({
    from:    FROM,
    to:      devTo,
    subject: `Re: ${message.subject}`,
    html: `
      <p>${parsed.data.replyText.replace(/\n/g, '<br/>')}</p>
      <hr/>
      <p style="color:#666;font-size:12px;">
        <strong>Original message from ${message.name}:</strong><br/>
        ${message.message.replace(/\n/g, '<br/>')}
      </p>
    `,
  })

  await markMessageRead(id)

  return NextResponse.json({ ok: true })
}
