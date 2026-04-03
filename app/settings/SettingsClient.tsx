'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Moon, Sun, Download, Trash2, LogOut, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { calculateCurrentStreak } from '@/lib/utils/streaks'
import { format, parseISO } from 'date-fns'

interface SettingsStats {
  totalDays: number
  streak: number
  memberSince: string | null
}

export function SettingsClient({ userId, email }: { userId: string; email: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const [stats, setStats] = useState<SettingsStats>({ totalDays: 0, streak: 0, memberSince: null })
  const [profile, setProfile] = useState<{ name: string | null }>({ name: null })
  const [showAbout, setShowAbout] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const supabase = createClient()

    async function loadStats() {
      const [{ data: profileData }, { data: logs }, { data: allDates }] =
        await Promise.all([
          supabase.from('profiles').select('name, created_at').eq('id', userId).single(),
          supabase
            .from('daily_logs')
            .select('log_date')
            .eq('user_id', userId)
            .order('log_date', { ascending: false }),
          supabase
            .from('daily_logs')
            .select('log_date')
            .eq('user_id', userId),
        ])

      setProfile({ name: profileData?.name ?? null })

      const dates = (allDates ?? []).map((r: { log_date: string }) => r.log_date)
      setStats({
        totalDays: logs?.length ?? 0,
        streak: calculateCurrentStreak(dates),
        memberSince: profileData?.created_at ?? null,
      })
    }

    loadStats()
  }, [userId])

  async function handleExport() {
    setExporting(true)
    try {
      const supabase = createClient()
      const [
        { data: logs },
        { data: entries },
        { data: mentalStates },
        { data: habits },
        { data: weeklyInsights },
      ] = await Promise.all([
        supabase.from('daily_logs').select('*').eq('user_id', userId),
        supabase.from('parsed_entries').select('*').eq('user_id', userId),
        supabase.from('mental_states').select('*').eq('user_id', userId),
        supabase.from('habits').select('*').eq('user_id', userId),
        supabase.from('weekly_insights').select('*').eq('user_id', userId),
      ])

      const payload = {
        exported_at: new Date().toISOString(),
        daily_logs: logs ?? [],
        parsed_entries: entries ?? [],
        mental_states: mentalStates ?? [],
        habits: habits ?? [],
        weekly_insights: weeklyInsights ?? [],
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stride-export-${format(new Date(), 'yyyy-MM-dd')}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  async function handleDeleteAccount() {
    if (deleteConfirm.toLowerCase() !== 'delete') return
    setDeleting(true)
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' })
      if (res.ok) {
        router.push('/auth')
      }
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const initials =
    (profile.name ?? email)
      .split(/[\s@]/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || 'S'

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">

      {/* Profile */}
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/20">
          <span className="text-xl font-bold text-[var(--accent)]">{initials}</span>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)]">
            {profile.name ?? email.split('@')[0]}
          </p>
          <p className="text-sm text-[var(--text-muted)]">{email}</p>
        </div>
      </div>

      {/* Appearance */}
      {mounted && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Appearance
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon size={18} className="text-[var(--accent)]" />
              ) : (
                <Sun size={18} className="text-amber-400" />
              )}
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
              }`}
            >
              <motion.div
                animate={{ x: theme === 'dark' ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Your Journey
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Days logged', value: stats.totalDays },
            { label: 'Current streak', value: `${stats.streak}🔥` },
            {
              label: 'Member since',
              value: stats.memberSince
                ? format(parseISO(stats.memberSince), 'MMM yyyy')
                : '—',
            },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <button
          onClick={() => setShowAbout(!showAbout)}
          className="flex w-full items-center justify-between p-5"
        >
          <span className="text-sm font-medium text-[var(--text-primary)]">About Stride</span>
          {showAbout ? (
            <ChevronUp size={16} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronDown size={16} className="text-[var(--text-muted)]" />
          )}
        </button>
        <AnimatePresence>
          {showAbout && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="border-t border-[var(--border)] px-5 pb-5 pt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                Stride helps you improve your daily routine gradually. The philosophy is
                simple: however bad your routine is, it can be improved — but not
                suddenly. Day by day. Bit by bit. Stride by stride.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Privacy */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">Privacy</p>
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
          Your journal is private. We never share your data. You can export or delete
          it at any time.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {/* Export */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--card-elevated)] disabled:opacity-50"
        >
          <Download size={16} className="text-[var(--accent)]" />
          {exporting ? 'Exporting…' : 'Export My Data'}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--card-elevated)]"
        >
          <LogOut size={16} />
          Sign Out
        </button>

        {/* Delete account */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-[var(--negative)]/20 bg-[var(--card)] px-5 py-4 text-sm font-medium text-[var(--negative)] transition-colors hover:bg-[var(--negative)]/5"
        >
          <Trash2 size={16} />
          Delete Account
        </button>
      </div>

      {/* Version */}
      <p className="pb-4 text-center text-xs text-[var(--text-muted)]">Stride v1.0.0</p>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
            >
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Delete your account?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                This permanently deletes all your journals, insights, and habits. There
                is no undo.
              </p>
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Type <strong>delete</strong> to confirm:
              </p>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="delete"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--negative)]"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] py-2.5 text-sm font-medium text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm.toLowerCase() !== 'delete' || deleting}
                  className="flex-1 rounded-xl bg-[var(--negative)] py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
