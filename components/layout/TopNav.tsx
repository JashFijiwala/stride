'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PenLine, CalendarDays, BarChart2, ClipboardList, Settings } from 'lucide-react'

const tabs = [
  { href: '/today', label: 'Check-in', Icon: PenLine },
  { href: '/history', label: 'History', Icon: CalendarDays },
  { href: '/insights', label: 'Wellbeing', Icon: BarChart2 },
  { href: '/screening', label: 'Screen', Icon: ClipboardList },
  { href: '/settings', label: 'Settings', Icon: Settings },
]

export function TopNav() {
  const pathname = usePathname()

  if (pathname.startsWith('/auth')) return null

  return (
    <nav className="hidden border-b border-[#262626] bg-[#0A0A0A]/80 backdrop-blur-lg dark:bg-[#0A0A0A]/80 lg:block">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <span className="text-lg font-semibold text-[#F1F5F9]">MindLens</span>
        <div className="flex items-center gap-1">
          {tabs.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#818CF8]/10 text-[#818CF8]'
                    : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
