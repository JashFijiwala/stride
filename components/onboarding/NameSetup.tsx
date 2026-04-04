'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store/useStore'

interface NameSetupProps {
  userId: string
  onComplete: (name: string) => void
  onSkip: () => void
}

export function NameSetup({ userId, onComplete, onSkip }: NameSetupProps) {
  const { setCurrentName } = useStore()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Only letters and spaces, max 20 chars
    const val = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 20)
    setName(val)
  }

  async function handleContinue() {
    const trimmed = name.trim()
    if (trimmed.length < 2) return
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase
        .from('profiles')
        .update({ name: trimmed })
        .eq('id', userId)
      // Update store FIRST so the greeting reacts immediately, before any re-render
      setCurrentName(trimmed)
      localStorage.setItem('stride_name_set', '1')
      onComplete(trimmed)
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && name.trim().length >= 2) handleContinue()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)] px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
        className="w-full max-w-sm"
      >
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/15">
          <span className="text-3xl">👋</span>
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-[var(--text-primary)]">
          What should we call you?
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          This is how Stride will greet you every day.
        </p>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Your first name"
          className="mt-8 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)]/60"
        />

        <motion.button
          onClick={handleContinue}
          disabled={name.trim().length < 2 || saving}
          whileTap={{ scale: 0.97 }}
          className="mt-4 w-full rounded-2xl bg-[var(--accent)] py-4 text-base font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </motion.button>

        <button
          onClick={onSkip}
          className="mt-3 w-full py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          Skip for now
        </button>
      </motion.div>
    </motion.div>
  )
}
