import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { markMessageRead, getMessageById } from '@/services/contactService'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: { message: 'Unauthorised', code: 'UNAUTHORISED' } },
      { status: 401 }
    )
  }

  const { id } = await params
  const message = await getMessageById(id)
  if (!message) {
    return NextResponse.json(
      { error: { message: 'Message not found', code: 'NOT_FOUND' } },
      { status: 404 }
    )
  }

  const updated = await markMessageRead(id)
  return NextResponse.json({ data: { id: updated.id, read: updated.read } })
}
