import { auth } from '../../../auth'
import { redirect } from 'next/navigation'
import { getOrCreateReferralCode, getReferralStats, REFERRAL_DISCOUNT_PCT } from '@/services/referralService'
import { CopyCodeButton } from './CopyCodeButton'

export const metadata = { title: 'Refer a Friend — SparkleClean' }

export default async function ReferralPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'customer') redirect('/account/login')

  const code  = await getOrCreateReferralCode(session.user.id)
  const stats = await getReferralStats(session.user.id)

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://sparkleclean.com'}/booking?ref=${code.code}`

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Refer a Friend</h1>
      <p className="text-gray-500 mb-8">
        Share your unique code — your friend gets {REFERRAL_DISCOUNT_PCT}% off their first booking.
      </p>

      {/* Code card */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 mb-8">
        <p className="text-sm font-medium text-gray-500 mb-2">Your referral code</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold tracking-widest text-brand-700 font-mono">
            {code.code}
          </span>
          <CopyCodeButton code={code.code} />
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Discount capped at £50 per booking. Applied automatically at checkout.
        </p>
      </div>

      {/* Share link */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 mb-8">
        <p className="text-sm font-medium text-gray-700 mb-2">Share this link</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={bookingUrl}
            className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 font-mono truncate"
          />
          <CopyCodeButton code={bookingUrl} label="Copy link" />
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Your referral stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center py-4 rounded-lg bg-gray-50">
            <p className="text-3xl font-bold text-brand-600">{stats?.uses ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Successful referrals</p>
          </div>
          <div className="text-center py-4 rounded-lg bg-gray-50">
            <p className="text-3xl font-bold text-brand-600">
              £{((stats?.uses ?? 0) * 50).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Est. savings given to friends</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">How it works</h2>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center">1</span>
            Share your code or link with a friend.
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center">2</span>
            They enter <span className="font-mono font-medium">{code.code}</span> at checkout and get {REFERRAL_DISCOUNT_PCT}% off (up to £50).
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center">3</span>
            Your referral count goes up. More rewards coming soon!
          </li>
        </ol>
      </div>
    </div>
  )
}
