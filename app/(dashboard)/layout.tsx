import { Suspense } from 'react'
import MobileNav from '@/components/layout/MobileNav'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <Suspense fallback={<div className="w-56 bg-white border-r border-zinc-200 h-full" />}>
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile: drawer + top bar handled by MobileNav */}
      <div className="md:hidden">
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
      </div>

      <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
