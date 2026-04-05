'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { BookOpen, PlusCircle, Tags, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/pin/actions'

const navItems = [
  { label: 'Recepten', href: '/recepten', icon: BookOpen },
  { label: 'Nieuw', href: '/recepten/nieuw', icon: PlusCircle },
  { label: 'Categorieën', href: '/categorieen', icon: Tags },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/recepten') return pathname === '/recepten'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile bottom navigation bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-stretch justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2 pt-3 text-xs font-medium transition-colors',
                  active
                    ? 'text-honey-700'
                    : 'text-gray-400'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl transition-colors',
                  active ? 'bg-honey-100' : ''
                )}>
                  <Icon className={cn('h-5 w-5', active ? 'text-honey-700' : 'text-gray-400')} />
                </div>
                {item.label}
              </Link>
            )
          })}

          {/* Uitloggen */}
          <form action={logout} className="flex flex-1">
            <button
              type="submit"
              className="flex flex-1 flex-col items-center gap-1 py-2 pt-3 text-xs font-medium text-gray-400 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl">
                <LogOut className="h-5 w-5 text-gray-400" />
              </div>
              Uitloggen
            </button>
          </form>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-honey-300 shrink-0">
            <Image src="/erik-anne-eten.jpg" alt="Erik en Anne" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Recepten</h1>
            <p className="text-xs text-gray-500 -mt-0.5">van Anne</p>
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

        {/* Uitloggen */}
        <div className="px-3 py-4 border-t border-gray-200">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5 text-gray-400" />
              Uitloggen
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
