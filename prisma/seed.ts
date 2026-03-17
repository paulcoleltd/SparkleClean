import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = process.env.ADMIN_SEED_PASSWORD
  if (!adminPassword) throw new Error('ADMIN_SEED_PASSWORD env var is required to seed admin account')

  const adminHash   = await bcrypt.hash(adminPassword,  12)
  const cleanerHash = await bcrypt.hash('Cleaner123!',  12)
  const customerHash = await bcrypt.hash('Customer123!', 12)

  const admin = await prisma.admin.upsert({
    where:  { email: 'admin@sparkleclean.com' },
    update: {},
    create: { email: 'admin@sparkleclean.com', passwordHash: adminHash, name: 'SparkleClean Admin' },
  })
  console.log(`✓ Admin     : ${admin.email}  (password = ADMIN_SEED_PASSWORD)`)

  const cleaner = await prisma.cleaner.upsert({
    where:  { email: 'cleaner@sparkleclean.com' },
    update: {},
    create: { email: 'cleaner@sparkleclean.com', passwordHash: cleanerHash, name: 'Test Cleaner' },
  })
  console.log(`✓ Cleaner   : ${cleaner.email}  (password = Cleaner123!)`)

  const customer = await prisma.customer.upsert({
    where:  { email: 'customer@sparkleclean.com' },
    update: {},
    create: { email: 'customer@sparkleclean.com', passwordHash: customerHash, name: 'Test Customer' },
  })
  console.log(`✓ Customer  : ${customer.email}  (password = Customer123!)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
