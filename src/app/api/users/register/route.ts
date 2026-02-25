import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuid } from 'uuid'
import { Role } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clerkId, firstName, lastName, email, phone, role } = body

    // Validate required fields
    if (!clerkId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already registered' },
        { status: 409 }
      )
    }

    // Generate unique QR code
    const qrCode = `GNEX-${uuid()}`

    // Create user
    const user = await prisma.user.create({
      data: {
        clerkId,
        role: role || Role.CLIENT,
        firstName,
        lastName,
        email,
        phone,
        qrCode,
      },
    })

    return NextResponse.json(
      { 
        success: true, 
        user: {
          id: user.id,
          qrCode: user.qrCode,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('User registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
