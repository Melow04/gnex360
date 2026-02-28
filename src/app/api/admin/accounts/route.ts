import { NextRequest, NextResponse } from 'next/server'
import { Role, UserStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrCoach } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const access = await requireOwnerOrCoach()
    if (!access.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim()
    const roleParam = searchParams.get('role')?.trim().toUpperCase()
    const statusParam = searchParams.get('status')?.trim().toUpperCase()

    const where: {
      OR?: Array<{
        firstName?: { contains: string; mode: 'insensitive' }
        lastName?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
      }>
      role?: Role
      status?: UserStatus
    } = {}

    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (roleParam && Object.values(Role).includes(roleParam as Role)) {
      where.role = roleParam as Role
    }

    if (statusParam && Object.values(UserStatus).includes(statusParam as UserStatus)) {
      where.status = statusParam as UserStatus
    }

    const accounts = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      accounts: accounts.map((account) => ({
        ...account,
        role: account.role.toLowerCase(),
        status: account.status.toLowerCase(),
      })),
    })
  } catch (error) {
    console.error('Get admin accounts error:', error)
    return NextResponse.json({ error: 'Failed to load accounts' }, { status: 500 })
  }
}
