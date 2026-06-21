import { Suspense } from 'react'
import MobileNav from '@/components/layout/MobileNav'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-subtle)]">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <Suspense fallback={<div className="w-60 bg-[var(--bg-card)] border-r border-[var(--border)] h-full" />}>
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile: drawer + top bar */}
      <div className="md:hidden">
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
      </div>

      <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
