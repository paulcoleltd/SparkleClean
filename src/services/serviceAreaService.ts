import { prisma } from '@/lib/prisma'

export interface CreateServiceAreaInput {
  name:      string
  postcodes: string[]
}

/**
 * Normalise a postcode prefix for consistent matching.
 * Strips spaces, uppercases, returns just the outward code (e.g. "SW1A" from "SW1A 1AA").
 */
export function normalisePostcode(raw: string): string {
  const cleaned = raw.replace(/\s+/g, '').toUpperCase()
  // Full UK postcode → take everything before the last 3 chars (inward code)
  if (cleaned.length >= 5) return cleaned.slice(0, cleaned.length - 3)
  return cleaned
}

/**
 * Check whether a postcode falls within any active service area.
 * Matching is prefix-based: "SW1A" matches stored prefixes ["SW1", "SW1A"].
 */
export async function isPostcodeServiced(postcode: string): Promise<{ serviced: boolean; areaName?: string }> {
  const prefix = normalisePostcode(postcode)
  const areas  = await prisma.serviceArea.findMany({ where: { active: true } })

  for (const area of areas) {
    const match = area.postcodes.some(p => prefix.startsWith(p.toUpperCase()))
    if (match) return { serviced: true, areaName: area.name }
  }

  // If no service areas are configured at all, allow all postcodes
  if (areas.length === 0) return { serviced: true }

  return { serviced: false }
}

export async function getServiceAreas() {
  return prisma.serviceArea.findMany({ orderBy: { name: 'asc' } })
}

export async function createServiceArea(input: CreateServiceAreaInput) {
  return prisma.serviceArea.create({
    data: {
      name:      input.name,
      postcodes: input.postcodes.map(p => p.toUpperCase().replace(/\s+/g, '')),
    },
  })
}

export async function updateServiceArea(id: string, input: Partial<CreateServiceAreaInput & { active: boolean }>) {
  return prisma.serviceArea.update({
    where: { id },
    data: {
      ...(input.name      !== undefined ? { name: input.name }                                                  : {}),
      ...(input.postcodes !== undefined ? { postcodes: input.postcodes.map(p => p.toUpperCase().replace(/\s+/g, '')) } : {}),
      ...(input.active    !== undefined ? { active: input.active }                                              : {}),
    },
  })
}

export async function deleteServiceArea(id: string) {
  return prisma.serviceArea.delete({ where: { id } })
}
