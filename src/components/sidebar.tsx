'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, PlusCircle, Tags, Menu, X, CookingPot } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Recepten', href: '/recepten', icon: BookOpen },
  { label: 'Nieuw Recept', href: '/recepten/nieuw', icon: PlusCircle },
  { label: 'Categorieën', href: '/categorieen', icon: Tags },
]

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/recepten') return pathname === '/recepten'
    return pathname.startsWith(href)
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-honey-100">
          <CookingPot className="h-6 w-6 text-honey-700" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Anne&apos;s</h1>
          <p className="text-xs text-gray-500 -mt-0.5">Recepten</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-honey-500 text-honey-950'
                  : 'text-gray-600 hover:bg-honey-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-5 w-5', active ? 'text-honey-950' : 'text-gray-400')} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center h-16 px-4 bg-white border-b border-gray-200">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <CookingPot className="h-5 w-5 text-honey-600" />
          <span className="font-semibold text-gray-900">Anne&apos;s Recepten</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-white border-r border-gray-200">
        {navContent}
      </aside>
    </>
  )
}
