import { NextRequest, NextResponse } from 'next/server'
import { sendTomorrowReminders } from '@/services/reminderService'

/**
 * GET /api/cron/reminders
 *
 * Called daily by Vercel Cron (see vercel.json).
 * Protected by a shared secret in the Authorization header.
 *
 * Vercel automatically sets Authorization: Bearer <CRON_SECRET>
 * when invoking cron jobs — no manual header needed in production.
 */
export async function GET(req: NextRequest) {
  // Verify the cron secret — rejects any external caller without the token
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const result = await sendTomorrowReminders()

    console.log('[cron/reminders] Complete —', result)

    return NextResponse.json({
      ok:      true,
      sent:    result.sent,
      smsSent: result.smsSent,
      failed:  result.failed,
      ...(result.errors.length ? { errors: result.errors } : {}),
    })
  } catch (err) {
    console.error('[cron/reminders] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
