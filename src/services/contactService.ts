import { prisma } from '@/lib/prisma'
import type { CreateContactInput } from '@/types/contact'

export async function createContactMessage(input: CreateContactInput) {
  return prisma.contactMessage.create({
    data: {
      name:    input.name,
      email:   input.email,
      phone:   input.phone ?? null,
      subject: input.subject,
      message: input.message,
    },
  })
}

export async function getMessages(options: { page?: number; unreadOnly?: boolean } = {}) {
  const { page = 1, unreadOnly = false } = options
  const pageSize = 20
  const where    = unreadOnly ? { read: false } : {}

  const [messages, total] = await prisma.$transaction([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    pageSize,
      skip:    (page - 1) * pageSize,
    }),
    prisma.contactMessage.count({ where }),
  ])

  return { messages, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function markMessageRead(id: string) {
  return prisma.contactMessage.update({ where: { id }, data: { read: true } })
}

export async function getMessageById(id: string) {
  return prisma.contactMessage.findUnique({ where: { id } })
}
