import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { v4 as uuid } from 'uuid'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  // Get the Svix headers for verification
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    )
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any

  // Verify the webhook signature
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Handle the webhook event
  const eventType = evt.type

  try {
    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { clerkId: id }
        })

        if (existingUser) {
          console.log(`User ${id} already exists`)
          return NextResponse.json({ message: 'User already exists' })
        }

        // Get primary email
        const primaryEmail = email_addresses?.find((e: any) => e.id === evt.data.primary_email_address_id)
        const email = primaryEmail?.email_address

        if (!email) {
          console.error('No email found for user')
          return NextResponse.json(
            { error: 'No email found' },
            { status: 400 }
          )
        }

        // Get primary phone (optional)
        const primaryPhone = phone_numbers?.find((p: any) => p.id === evt.data.primary_phone_number_id)
        const phone = primaryPhone?.phone_number || null

        // Generate unique QR code
        const qrCode = `GNEX-${uuid()}`

        // Create user in database with CLIENT role by default
        const user = await prisma.user.create({
          data: {
            clerkId: id,
            role: Role.CLIENT,
            firstName: first_name || 'User',
            lastName: last_name || '',
            email,
            phone,
            qrCode,
          },
        })

        console.log(`✅ Created user: ${user.email} (${user.id})`)

        return NextResponse.json({
          message: 'User created successfully',
          userId: user.id
        })
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data

        const primaryEmail = email_addresses?.find((e: any) => e.id === evt.data.primary_email_address_id)
        const email = primaryEmail?.email_address

        const primaryPhone = phone_numbers?.find((p: any) => p.id === evt.data.primary_phone_number_id)
        const phone = primaryPhone?.phone_number || null

        // Update user in database
        const user = await prisma.user.update({
          where: { clerkId: id },
          data: {
            firstName: first_name || 'User',
            lastName: last_name || '',
            email: email || undefined,
            phone,
          },
        })

        console.log(`✅ Updated user: ${user.email}`)

        return NextResponse.json({
          message: 'User updated successfully',
          userId: user.id
        })
      }

      case 'user.deleted': {
        const { id } = evt.data

        // Note: In production, you might want to soft delete instead
        await prisma.user.delete({
          where: { clerkId: id }
        })

        console.log(`✅ Deleted user: ${id}`)

        return NextResponse.json({
          message: 'User deleted successfully'
        })
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`)
        return NextResponse.json({ message: 'Event received' })
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
