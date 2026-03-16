'use client'

import { cn, formatPrice } from '@/lib/utils'
import {
  SERVICE_LABELS, FREQUENCY_LABELS, SIZE_LABELS,
  TIME_LABELS, EXTRA_LABELS,
} from '@/types/booking'
import { calculateTotal, calculateDiscount, FREQUENCY_DISCOUNTS } from '@/services/bookingService'
import { calculateReferralDiscount, REFERRAL_DISCOUNT_PCT } from '@/services/referralService'

// Re-export calculateTotal so the form can use it client-side for display only.
// The server always recalculates — this is display-only.
export { calculateTotal }

interface PriceSummaryProps {
  service:              string
  frequency:            string
  propertySize:         string
  timeSlot:             string
  date:                 string
  extras:               string[]
  referralApplied?:     boolean
  promoDiscountPence?:  number
  promoDescription?:    string
  className?:           string
}

export function PriceSummary({
  service, frequency, propertySize, timeSlot, date, extras,
  referralApplied, promoDiscountPence = 0, promoDescription, className,
}: PriceSummaryProps) {
  const hasService     = Boolean(service)
  const subtotal       = hasService ? calculateTotal(service, extras, 'ONE_TIME') : 0
  const discountRate   = FREQUENCY_DISCOUNTS[frequency] ?? 0
  const discount       = hasService && discountRate > 0 ? calculateDiscount(service, extras, frequency) : 0
  const afterFrequency = subtotal - discount
  const referralDiscount = referralApplied && hasService ? calculateReferralDiscount(afterFrequency) : 0
  const total          = Math.max(0, afterFrequency - referralDiscount - promoDiscountPence)

  return (
    <div className={cn('rounded-lg border border-brand-200 bg-brand-50 p-5', className)}>
      <h3 className="mb-3 text-base font-semibold text-gray-800">Booking Summary</h3>

      <dl className="space-y-2 text-sm">
        <SummaryRow label="Service"       value={SERVICE_LABELS[service]}     />
        <SummaryRow label="Date"          value={date || undefined}            />
        <SummaryRow label="Time"          value={TIME_LABELS[timeSlot]}       />
        <SummaryRow label="Property size" value={SIZE_LABELS[propertySize]}   />
        <SummaryRow label="Frequency"     value={FREQUENCY_LABELS[frequency]} />

        {extras.length > 0 && (
          <SummaryRow
            label="Add-ons"
            value={extras.map(e => EXTRA_LABELS[e] ?? e).join(', ')}
          />
        )}
      </dl>

      <div className="mt-4 border-t border-brand-200 pt-4 space-y-1.5">
        {/* Show subtotal + discount lines when a recurring frequency is chosen */}
        {discount > 0 && (
          <>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-medium text-green-700">
              <span>
                {Math.round(discountRate * 100)}% recurring discount
                <span className="ml-1 text-xs font-normal text-green-600">
                  ({FREQUENCY_LABELS[frequency]})
                </span>
              </span>
              <span>−{formatPrice(discount)}</span>
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Estimated total</span>
          <span
            className={cn(
              'text-xl font-bold',
              total > 0 ? 'text-brand-600' : 'text-gray-400'
            )}
          >
            {total > 0 ? `£${formatPrice(total)}` : '£0'}
          </span>
        </div>
        {referralDiscount > 0 && (
          <div className="flex items-center justify-between text-sm font-medium text-purple-700">
            <span>{REFERRAL_DISCOUNT_PCT}% referral discount</span>
            <span>−£{formatPrice(referralDiscount)}</span>
          </div>
        )}
        {promoDiscountPence > 0 && (
          <div className="flex items-center justify-between text-sm font-medium text-teal-700">
            <span>Promo: {promoDescription ?? 'Code applied'}</span>
            <span>−£{formatPrice(promoDiscountPence)}</span>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Final price confirmed on booking.
        </p>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className={cn('text-right font-medium', value ? 'text-gray-800' : 'text-gray-300')}>
        {value ?? 'Not selected'}
      </dd>
    </div>
  )
}
