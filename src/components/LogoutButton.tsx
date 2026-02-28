'use client'

import { SignOutButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

type LogoutButtonProps = {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <SignOutButton>
      <Button variant="outline" className={className}>Log Out</Button>
    </SignOutButton>
  )
}
