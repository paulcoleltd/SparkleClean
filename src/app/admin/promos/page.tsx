import { Metadata } from 'next'
import { auth } from '../../../../auth'
import { redirect } from 'next/navigation'
import { getPromoCodes } from '@/services/promoService'
import CreatePromoForm from './CreatePromoForm'
import PromoTable from './PromoTable'

export const metadata: Metadata = { title: 'Promo Codes — SparkleClean Admin' }

export default async function PromosPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/admin/login')

  const { codes } = await getPromoCodes()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create discount codes for customers. Codes are validated server-side at checkout.
        </p>
      </div>

      <CreatePromoForm />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">All Codes</h2>
        </div>
        <PromoTable initial={codes as Parameters<typeof PromoTable>[0]['initial']} />
      </div>
    </div>
  )
}
