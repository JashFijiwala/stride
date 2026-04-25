'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { PenLine, CalendarDays, BarChart2, ClipboardList, Settings } from 'lucide-react'

const tabs = [
  { href: '/today', label: 'Check-in', Icon: PenLine },
  { href: '/history', label: 'History', Icon: CalendarDays },
  { href: '/insights', label: 'Wellbeing', Icon: BarChart2 },
  { href: '/screening', label: 'Screen', Icon: ClipboardList },
  { href: '/settings', label: 'Settings', Icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  // Don't render on auth pages
  if (pathname.startsWith('/auth')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-[#262626] bg-[#0A0A0A]/80 backdrop-blur-lg dark:bg-[#0A0A0A]/80 lg:hidden">
      <div className="mx-auto flex h-full max-w-2xl items-center justify-around px-2">
        {tabs.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className="relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-3"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 rounded-xl bg-[#818CF8]/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                size={20}
                className={
                  isActive
                    ? 'text-[#818CF8]'
                    : 'text-[#64748B] dark:text-[#64748B]'
                }
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-[#818CF8]' : 'text-[#64748B]'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
