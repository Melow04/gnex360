import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">GNEX 360</h1>
          <nav className="flex gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-5xl font-bold tracking-tight">
              Complete Gym Management System
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your gym operations with GNEX 360 - featuring member management,
              QR code access control, and subscription tracking.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/admin/dashboard">
                <Button size="lg" variant="outline">View Dashboard</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Identity & Access</CardTitle>
                <CardDescription>
                  Secure authentication with Clerk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ QR code entry system</li>
                  <li>✓ Role-based access control</li>
                  <li>✓ Member status management</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Membership & Plans</CardTitle>
                <CardDescription>
                  Flexible subscription management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Multiple plan templates</li>
                  <li>✓ Automatic expiry tracking</li>
                  <li>✓ Payment history</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>
                  Real-time insights and metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Active member counts</li>
                  <li>✓ Daily entry tracking</li>
                  <li>✓ Revenue overview</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          GNEX 360 - Stage 1 Core Operational Layer
        </div>
      </footer>
    </div>
  )
}
