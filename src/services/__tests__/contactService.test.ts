import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contactMessage: {
      create:     vi.fn(),
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      count:      vi.fn(),
      update:     vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import {
  createContactMessage,
  getMessages,
  markMessageRead,
  getMessageById,
} from '../contactService'
import { prisma } from '@/lib/prisma'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeMessage(id = 'msg-001') {
  return {
    id,
    name:      'Jane Smith',
    email:     'jane@example.com',
    phone:     null,
    subject:   'Test inquiry',
    message:   'Hello there',
    read:      false,
    createdAt: new Date('2026-03-01'),
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('createContactMessage()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('persists all fields including optional phone', async () => {
    vi.mocked(prisma.contactMessage.create).mockResolvedValue(makeMessage() as never)
    await createContactMessage({
      name: 'Jane Smith', email: 'jane@example.com',
      phone: '(555) 123-4567', subject: 'Test inquiry', message: 'Hello there',
    })
    expect(prisma.contactMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phone: '(555) 123-4567' }),
      })
    )
  })

  it('stores null when phone is omitted', async () => {
    vi.mocked(prisma.contactMessage.create).mockResolvedValue(makeMessage() as never)
    await createContactMessage({
      name: 'Jane Smith', email: 'jane@example.com',
      subject: 'Test inquiry', message: 'Hello there',
    })
    expect(prisma.contactMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ phone: null }) })
    )
  })
})

describe('getMessages()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0] as never)
  })

  it('defaults to page 1 with no filter', async () => {
    const result = await getMessages()
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(prisma.$transaction).toHaveBeenCalledOnce()
  })

  it('calculates totalPages correctly', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 45] as never)
    const result = await getMessages()
    expect(result.total).toBe(45)
    expect(result.totalPages).toBe(3) // ceil(45/20)
  })

  it('applies unreadOnly filter when requested', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[makeMessage()], 1] as never)
    await getMessages({ unreadOnly: true })
    // The $transaction call should include a findMany with where: { read: false }
    const txCall = vi.mocked(prisma.$transaction).mock.calls[0]![0] as unknown as unknown[]
    expect(txCall).toHaveLength(2) // findMany + count
  })

  it('skips correct number of records for page 2', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 50] as never)
    const result = await getMessages({ page: 2 })
    expect(result.page).toBe(2)
  })

  it('returns messages from the transaction result', async () => {
    const msgs = [makeMessage('msg-1'), makeMessage('msg-2')]
    vi.mocked(prisma.$transaction).mockResolvedValue([msgs, 2] as never)
    const result = await getMessages()
    expect(result.messages).toHaveLength(2)
  })
})

describe('markMessageRead()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates read to true for the given id', async () => {
    vi.mocked(prisma.contactMessage.update).mockResolvedValue({ ...makeMessage(), read: true } as never)
    await markMessageRead('msg-001')
    expect(prisma.contactMessage.update).toHaveBeenCalledWith({
      where: { id: 'msg-001' },
      data:  { read: true },
    })
  })
})

describe('getMessageById()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls findUnique with the given id', async () => {
    vi.mocked(prisma.contactMessage.findUnique).mockResolvedValue(makeMessage() as never)
    await getMessageById('msg-001')
    expect(prisma.contactMessage.findUnique).toHaveBeenCalledWith({ where: { id: 'msg-001' } })
  })

  it('returns null when message does not exist', async () => {
    vi.mocked(prisma.contactMessage.findUnique).mockResolvedValue(null)
    expect(await getMessageById('nonexistent')).toBeNull()
  })
})
