'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Phone } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'

const HELPLINES = [
  {
    name: 'Tele-MANAS',
    description: 'Government helpline · Free · 24/7',
    number: '14416',
    href: 'tel:14416',
    color: '#3B82F6',
  },
  {
    name: 'iCall',
    description: 'TISS helpline · Trained counselors',
    number: '9152987821',
    href: 'tel:9152987821',
    color: '#A78BFA',
  },
  {
    name: 'Vandrevala Foundation',
    description: '24/7 mental health helpline',
    number: '1860-2662-345',
    href: 'tel:18602662345',
    color: '#818CF8',
  },
  {
    name: 'Emergency Services',
    description: 'If you are in immediate danger',
    number: '112',
    href: 'tel:112',
    color: '#F87171',
  },
]

export function CrisisModal() {
  const { crisisVisible, hideCrisis } = useStore()
  const router = useRouter()

  // Prevent Escape from dismissing — this is an ethical requirement
  useEffect(() => {
    if (!crisisVisible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    // Capture phase so we intercept before any other listener
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [crisisVisible])

  return (
    <AnimatePresence>
      {crisisVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm"
          // No onClick handler — overlay click does NOT dismiss
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="w-full max-w-md rounded-2xl border border-blue-500/20 bg-[var(--card)] p-6 shadow-2xl"
          >
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              You&apos;re not alone 💙
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              It looks like you might be going through a really difficult time. That takes
              courage to acknowledge. Please reach out to someone who can help:
            </p>

            <div className="mt-4 space-y-2">
              {HELPLINES.map((h) => (
                <a
                  key={h.name}
                  href={h.href}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors"
                  style={{
                    borderColor: `${h.color}30`,
                    backgroundColor: `${h.color}0D`,
                  }}
                >
                  <Phone size={15} style={{ color: h.color }} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--text-primary)]">{h.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{h.description}</p>
                  </div>
                  <span className="shrink-0 font-semibold" style={{ color: h.color }}>
                    {h.number}
                  </span>
                </a>
              ))}
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
              Your college counselor is also a great first step. You don&apos;t have to go
              through this alone.
            </p>

            <button
              onClick={() => {
                hideCrisis()
                router.push('/resources')
              }}
              className="mt-3 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
            >
              Find more resources →
            </button>

            <button
              onClick={hideCrisis}
              className="mt-4 w-full rounded-xl border border-[var(--border)] bg-transparent py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--card-elevated)] hover:text-[var(--text-primary)]"
            >
              I&apos;m okay, take me back
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
