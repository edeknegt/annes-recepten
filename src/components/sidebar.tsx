'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Home, BookOpen, ShoppingCart, Settings, LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/pin/actions'

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Recepten', href: '/recepten', icon: BookOpen },
  { label: 'Boodschappen', href: '/lijst', icon: ShoppingCart },
  { label: 'Instellingen', href: '/categorieen', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [loggingOut, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(() => logout())
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile: fade achter en onder de pill — geeft content 'doorzichtig'-effect.
          Wordt verborgen als er een bottom-sheet open staat (zie globals.css). */}
      <div
        aria-hidden
        className="nav-fade lg:hidden fixed left-0 right-0 bottom-0 z-30 pointer-events-none h-28 bg-gradient-to-t from-honey-100/80 via-honey-100/40 to-transparent"
      />

      {/* Mobile bottom navigation bar (floating pill, WhatsApp-style) */}
      <nav
        className="mobile-nav lg:hidden fixed left-3 right-3 z-40 rounded-full bg-white/85 backdrop-blur-md border border-gray-200 shadow-lg shadow-honey-900/20"
        style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}
      >
        <div className="flex items-stretch justify-around h-14 px-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 mx-0.5 rounded-full py-1.5 transition-colors',
                  active ? 'bg-honey-200 text-honey-800' : 'text-gray-500'
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                <span
                  className={cn(
                    'text-[10px] leading-none',
                    active ? 'font-bold' : 'font-medium'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}

          <button
            onPointerDown={handleLogout}
            disabled={loggingOut}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 mx-0.5 rounded-full py-1.5 text-gray-500"
          >
            {loggingOut ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <LogOut className="h-4.5 w-4.5" />}
            <span className="text-[10px] leading-none font-medium">Uitloggen</span>
          </button>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-honey-300 shrink-0">
            <Image src="/erik-anne-drinks.png" alt="Erik en Anne" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Anne&apos;s keuken</h1>
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
          <button
            onPointerDown={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            {loggingOut ? <Loader2 className="h-5 w-5 text-gray-400 animate-spin" /> : <LogOut className="h-5 w-5 text-gray-400" />}
            Uitloggen
          </button>
        </div>
      </aside>
    </>
  )
}
