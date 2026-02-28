'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton, useUser } from '@clerk/nextjs'
import {
  BarChart3,
  ClipboardList,
  UserPlus,
  ScanLine,
  WalletCards,
  Users,
  Settings,
  EllipsisVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/LogoutButton'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: BarChart3,
  },
  {
    href: '/admin/plans',
    label: 'Plans',
    icon: ClipboardList,
  },
  {
    href: '/admin/personal-plans',
    label: 'Personal Plans',
    icon: WalletCards,
  },
  {
    href: '/admin/register-person',
    label: 'Register',
    icon: UserPlus,
  },
  {
    href: '/admin/entry-logs',
    label: 'Entry Logs',
    icon: ScanLine,
  },
  {
    href: '/admin/accounts',
    label: 'Accounts',
    icon: Users,
  },
]

export function AdminNav() {
  const pathname = usePathname()
  const { user } = useUser()
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  useEffect(() => {
    setIsAccountMenuOpen(false)
  }, [pathname])

  const fullName = user?.fullName || 'Account'
  const email = user?.primaryEmailAddress?.emailAddress || ''
  const imageUrl = user?.imageUrl

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <h1 className="text-lg font-semibold leading-none">GNEX 360 Admin</h1>
          <LogoutButton className="h-8 px-3" />
        </div>
      </header>

      <aside className="hidden md:fixed md:left-0 md:top-0 md:z-30 md:flex md:h-screen md:w-72 md:flex-col md:border-r md:bg-card/20">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-base font-semibold leading-none">GNEX 360 Admin</h2>
        </div>

        <div className="px-4 pt-4">
          <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Navigation
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-4 pt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start rounded-lg"
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </nav>

        <div className="border-t space-y-3 p-4">
          <div className="rounded-lg border border-border/70 bg-card/80 p-3">
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <img src={imageUrl} alt={fullName} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold">
                  {fullName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>

              <div className="relative ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsAccountMenuOpen((previous) => !previous)}
                >
                  <EllipsisVertical className="h-4 w-4" />
                  <span className="sr-only">Open account menu</span>
                </Button>

                {isAccountMenuOpen && (
                  <div className="absolute bottom-9 right-0 z-20 mb-1 w-44 rounded-md border border-border/70 bg-background p-1 shadow-md">
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link href="/account/settings">
                        <Settings className="h-4 w-4" />
                        Account Settings
                      </Link>
                    </Button>

                    <SignOutButton>
                      <Button variant="ghost" className="w-full justify-start">
                        Log Out
                      </Button>
                    </SignOutButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
        <div className="flex h-16 items-center px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div className="pl-1">
            <LogoutButton className="h-8 px-3" />
          </div>
        </div>
      </nav>
    </>
  )
}
