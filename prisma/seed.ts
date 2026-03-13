import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = process.env.ADMIN_SEED_PASSWORD
  if (!password) throw new Error('ADMIN_SEED_PASSWORD env var is required to seed admin account')

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.admin.upsert({
    where:  { email: 'admin@sparkleclean.com' },
    update: {},
    create: {
      email:        'admin@sparkleclean.com',
      passwordHash,
      name:         'SparkleClean Admin',
    },
  })

  console.log(`✓ Admin account ready: ${admin.email}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
