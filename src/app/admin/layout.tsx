import { AdminNav } from '@/components/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20 md:flex">
      <AdminNav />
      <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8 lg:px-10">{children}</main>
    </div>
  )
}
