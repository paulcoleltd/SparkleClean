import { auth } from '../../../../auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { REFERRAL_DISCOUNT_PCT, REFERRAL_DISCOUNT_MAX } from '@/services/referralService'

export const metadata = { title: 'Referrals — Admin | SparkleClean' }

async function getReferralStats() {
  const [topReferrers, totals] = await Promise.all([
    prisma.referralCode.findMany({
      where:   { uses: { gt: 0 } },
      orderBy: { uses: 'desc' },
      take:    20,
      select: {
        code:      true,
        uses:      true,
        createdAt: true,
        customer:  { select: { name: true, email: true } },
      },
    }),
    prisma.referralCode.aggregate({
      _sum:   { uses: true },
      _count: { id: true },
    }),
  ])

  return { topReferrers, totals }
}

export default async function AdminReferralsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/admin/login')

  const { topReferrers, totals } = await getReferralStats()
  const totalUses       = totals._sum.uses ?? 0
  const totalCodes      = totals._count.id
  // Est. total discount given: each use saves up to REFERRAL_DISCOUNT_MAX pence (£50)
  const estDiscountGiven = totalUses * REFERRAL_DISCOUNT_MAX

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Referral Programme</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Total referral codes" value={totalCodes.toString()} />
        <StatCard label="Successful referrals" value={totalUses.toString()} />
        <StatCard
          label="Est. discount given"
          value={`£${formatPrice(estDiscountGiven)}`}
          sub={`${REFERRAL_DISCOUNT_PCT}% per booking, capped at £${REFERRAL_DISCOUNT_MAX / 100}`}
        />
      </div>

      {/* Top referrers table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Top referrers</h2>
        </div>

        {topReferrers.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            No referrals used yet.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Customer</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Code</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Uses</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Est. savings given</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Code created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topReferrers.map((r) => (
                <tr key={r.code} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{r.customer.name}</p>
                    <p className="text-gray-400 text-xs">{r.customer.email}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-brand-700">{r.code}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-800">{r.uses}</td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    £{formatPrice(r.uses * REFERRAL_DISCOUNT_MAX)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400">
                    {r.createdAt.toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
