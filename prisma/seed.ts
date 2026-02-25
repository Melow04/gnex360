import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Hardcoded plans for demo
  const plans = [
    { name: 'Monthly', durationDays: 30, price: 799 },
    { name: 'Quarterly', durationDays: 90, price: 1999 },
    { name: 'Annual', durationDays: 365, price: 6999 },
  ]

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: {
        name: plan.name,
        durationDays: plan.durationDays,
        price: plan.price,
        isActive: true,
      },
    })
    console.log(`✓ Created plan: ${plan.name}`)
  }

  console.log('✅ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
