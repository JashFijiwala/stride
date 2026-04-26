'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share, Plus } from 'lucide-react'

export function InstallPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const dismissed = localStorage.getItem('stride_install_dismissed')

    if (isIOS && !isStandalone && !dismissed) {
      // Delay slightly so it doesn't flash on first load
      const t = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    setShow(false)
    localStorage.setItem('stride_install_dismissed', '1')
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] p-4 shadow-xl lg:left-auto lg:right-6 lg:max-w-xs"
        >
          <button
            onClick={dismiss}
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={13} />
          </button>
          <p className="pr-6 text-sm font-semibold text-[var(--text-primary)]">
            Add Haven to your Home Screen
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            Tap the{' '}
            <span className="inline-flex items-center gap-0.5 font-medium text-[var(--accent)]">
              <Share size={11} />
              Share
            </span>{' '}
            button, then{' '}
            <span className="inline-flex items-center gap-0.5 font-medium text-[var(--accent)]">
              <Plus size={11} />
              Add to Home Screen
            </span>{' '}
            for the best experience.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
