'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Moon, Sun, Trash2, LogOut, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { calculateCurrentStreak } from '@/lib/utils/streaks'
import { format, parseISO } from 'date-fns'

interface SettingsStats {
  totalDays: number
  streak: number
  memberSince: string | null
}

type ExportFormat = 'json' | 'csv' | 'pdf' | 'txt'

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
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)
  const [exportDone, setExportDone] = useState<ExportFormat | null>(null)

  const FOCUS_AREAS = [
    { label: 'Better health & fitness', value: 'health' },
    { label: 'Productivity & deep work', value: 'productivity' },
    { label: 'Better sleep & recovery', value: 'sleep' },
    { label: 'Mental wellbeing', value: 'mental_health' },
    { label: 'Financial discipline', value: 'finance' },
    { label: 'Learning & growth', value: 'learning' },
  ]
  const [goalsFocusAreas, setGoalsFocusAreas] = useState<string[]>([])
  const [goalsPositiveHabits, setGoalsPositiveHabits] = useState(['', '', ''])
  const [goalsNegativeHabits, setGoalsNegativeHabits] = useState(['', ''])
  const [goalsSaving, setGoalsSaving] = useState(false)
  const [goalsSaved, setGoalsSaved] = useState(false)

  function toggleGoalsFocusArea(value: string) {
    setGoalsFocusAreas((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value)
      if (prev.length >= 3) return [...prev.slice(1), value]
      return [...prev, value]
    })
  }

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const supabase = createClient()

    async function loadStats() {
      const [{ data: profileData }, { data: logs }, { data: allDates }, { data: goalsData }] =
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
          supabase
            .from('user_goals')
            .select('focus_areas, positive_habits, negative_habits')
            .eq('user_id', userId)
            .single(),
        ])

      setProfile({ name: profileData?.name ?? null })

      const dates = (allDates ?? []).map((r: { log_date: string }) => r.log_date)
      setStats({
        totalDays: logs?.length ?? 0,
        streak: calculateCurrentStreak(dates),
        memberSince: profileData?.created_at ?? null,
      })

      if (goalsData) {
        const fa: string[] = goalsData.focus_areas ?? []
        const ph: string[] = goalsData.positive_habits ?? []
        const nh: string[] = goalsData.negative_habits ?? []
        setGoalsFocusAreas(fa)
        setGoalsPositiveHabits([ph[0] ?? '', ph[1] ?? '', ph[2] ?? ''])
        setGoalsNegativeHabits([nh[0] ?? '', nh[1] ?? ''])
      }
    }

    loadStats()
  }, [userId])

  // ── Fetch all user data for export ──────────────────────────────────────────
  async function fetchAllData() {
    const supabase = createClient()
    const [
      { data: logs },
      { data: entries },
      { data: mentalStates },
      { data: habits },
      { data: weeklyInsights },
    ] = await Promise.all([
      supabase.from('daily_logs').select('*').eq('user_id', userId).order('log_date', { ascending: true }),
      supabase.from('parsed_entries').select('*').eq('user_id', userId),
      supabase.from('mental_states').select('*').eq('user_id', userId),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('weekly_insights').select('*').eq('user_id', userId),
    ])
    return {
      logs: logs ?? [],
      entries: entries ?? [],
      mentalStates: mentalStates ?? [],
      habits: habits ?? [],
      weeklyInsights: weeklyInsights ?? [],
    }
  }

  function triggerDownload(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── JSON ────────────────────────────────────────────────────────────────────
  async function exportJSON(data: Awaited<ReturnType<typeof fetchAllData>>) {
    const payload = {
      exported_at: new Date().toISOString(),
      daily_logs: data.logs,
      parsed_entries: data.entries,
      mental_states: data.mentalStates,
      habits: data.habits,
      weekly_insights: data.weeklyInsights,
    }
    triggerDownload(
      JSON.stringify(payload, null, 2),
      `mindlens-data-${format(new Date(), 'yyyy-MM-dd')}.json`,
      'application/json'
    )
  }

  // ── CSV ─────────────────────────────────────────────────────────────────────
  async function exportCSV(data: Awaited<ReturnType<typeof fetchAllData>>) {
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }

    const headers = [
      'Date', 'Rating', 'Mood', 'Weight (kg)',
      'Positive Entries', 'Negative Entries', 'Neutral Entries',
      'Mood Score', 'Energy Level', 'Stress Level',
      'Primary Mood', 'Raw Text',
    ]

    const rows = data.logs.map((log: Record<string, unknown>) => {
      const ms = data.mentalStates.find((m: Record<string, unknown>) => m.daily_log_id === log.id) as Record<string, unknown> | undefined
      const logEntries = data.entries.filter((e: Record<string, unknown>) => e.daily_log_id === log.id) as Record<string, unknown>[]
      return [
        log.log_date,
        log.self_rating ?? '',
        log.mood_emoji ?? '',
        log.weight_kg ?? '',
        logEntries.filter(e => e.sentiment === 'positive').length,
        logEntries.filter(e => e.sentiment === 'negative').length,
        logEntries.filter(e => e.sentiment === 'neutral').length,
        ms?.mood_score ?? '',
        ms?.energy_level ?? '',
        ms?.stress_level ?? '',
        ms?.primary_mood ?? '',
        log.raw_text ?? '',
      ].map(escape).join(',')
    })

    triggerDownload(
      [headers.join(','), ...rows].join('\n'),
      `mindlens-journal-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      'text/csv'
    )
  }

  // ── TXT ─────────────────────────────────────────────────────────────────────
  async function exportTXT(data: Awaited<ReturnType<typeof fetchAllData>>) {
    const lines: string[] = [
      'MINDLENS JOURNAL EXPORT',
      `Exported: ${format(new Date(), 'MMMM d, yyyy')}`,
      '',
    ]

    for (const log of data.logs as Record<string, unknown>[]) {
      const ms = data.mentalStates.find((m: Record<string, unknown>) => m.daily_log_id === log.id) as Record<string, unknown> | undefined
      const dateStr = log.log_date
        ? format(parseISO(log.log_date as string), 'EEEE, MMMM d yyyy')
        : String(log.log_date)

      lines.push('═══════════════════════════════════════')
      lines.push(dateStr)
      const meta: string[] = []
      if (log.self_rating) meta.push(`Rating: ${log.self_rating}/10`)
      if (log.mood_emoji) meta.push(`Mood: ${log.mood_emoji}`)
      if (log.weight_kg) meta.push(`Weight: ${log.weight_kg} kg`)
      if (meta.length) lines.push(meta.join(' | '))
      lines.push('═══════════════════════════════════════')
      lines.push('')
      lines.push(String(log.raw_text ?? ''))
      lines.push('')
      if (ms) {
        const msMeta: string[] = []
        if (ms.primary_mood) msMeta.push(String(ms.primary_mood))
        if (ms.energy_level) msMeta.push(`${ms.energy_level} energy`)
        if (msMeta.length) lines.push(`Mental State: ${msMeta.join(', ')}`)
        if (ms.summary) lines.push(String(ms.summary))
      }
      lines.push('───────────────────────────────────────')
      lines.push('')
    }

    triggerDownload(
      lines.join('\n'),
      `mindlens-journal-${format(new Date(), 'yyyy-MM-dd')}.txt`,
      'text/plain'
    )
  }

  // ── PDF ─────────────────────────────────────────────────────────────────────
  async function exportPDF(data: Awaited<ReturnType<typeof fetchAllData>>) {
    // Dynamic import to avoid SSR issues with jsPDF
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 18
    let y = margin

    const addText = (text: string, size: number, bold = false, color = '#111111') => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setTextColor(color)
      doc.text(text, margin, y)
      y += size * 0.5
    }

    const checkPage = (needed = 20) => {
      if (y + needed > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage()
        y = margin
      }
    }

    // Header
    doc.setFillColor('#818CF8')
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor('#FFFFFF')
    doc.text('MindLens Journal Export', margin, 18)
    y = 36

    addText(`Exported on ${format(new Date(), 'MMMM d, yyyy')}`, 10, false, '#555555')
    if (profile.name) addText(profile.name, 12, true)
    y += 4

    // Summary stats
    doc.setDrawColor('#E5E7EB')
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageW - margin, y)
    y += 6

    addText('Summary', 13, true)
    y += 2
    const summaryRows = [
      ['Total Days Logged', String(stats.totalDays)],
      ['Current Streak', `${stats.streak} days`],
      ['Member Since', stats.memberSince ? format(parseISO(stats.memberSince), 'MMMM yyyy') : '—'],
    ]
    autoTable(doc, {
      startY: y,
      head: [],
      body: summaryRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 80 } },
      theme: 'plain',
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

    // Journal entries
    doc.line(margin, y, pageW - margin, y)
    y += 6
    addText('Journal Entries', 13, true)
    y += 4

    for (const log of data.logs as Record<string, unknown>[]) {
      checkPage(30)
      const ms = data.mentalStates.find((m: Record<string, unknown>) => m.daily_log_id === log.id) as Record<string, unknown> | undefined
      const dateStr = log.log_date
        ? format(parseISO(log.log_date as string), 'EEEE, MMMM d, yyyy')
        : String(log.log_date)

      // Date heading
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor('#818CF8')
      doc.text(dateStr, margin, y)
      y += 5

      // Meta line
      const meta: string[] = []
      if (log.self_rating) meta.push(`Rating: ${log.self_rating}/10`)
      if (log.mood_emoji) meta.push(`Mood: ${log.mood_emoji}`)
      if (log.weight_kg) meta.push(`Weight: ${log.weight_kg} kg`)
      if (meta.length) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor('#888888')
        doc.text(meta.join('   '), margin, y)
        y += 5
      }

      // Raw text (wrapped)
      if (log.raw_text) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor('#333333')
        const wrapped = doc.splitTextToSize(String(log.raw_text), pageW - margin * 2)
        const textH = wrapped.length * 4.5
        checkPage(textH + 10)
        doc.text(wrapped, margin, y)
        y += textH
      }

      // Mental state
      if (ms?.summary) {
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor('#666666')
        const wrapped = doc.splitTextToSize(`Mental state: ${ms.summary}`, pageW - margin * 2)
        checkPage(wrapped.length * 4.5 + 6)
        doc.text(wrapped, margin, y)
        y += wrapped.length * 4.5
      }

      y += 6
      doc.setDrawColor('#E5E7EB')
      doc.line(margin, y - 2, pageW - margin, y - 2)
      y += 2
    }

    // Habits table
    if (data.habits.length > 0) {
      checkPage(40)
      y += 4
      addText('Habits', 13, true)
      y += 2
      autoTable(doc, {
        startY: y,
        head: [['Habit', 'Streak', 'Longest', 'Total']],
        body: (data.habits as Record<string, unknown>[]).map((h) => [
          String(h.habit_name ?? ''),
          String(h.current_streak ?? 0),
          String(h.longest_streak ?? 0),
          String(h.total_occurrences ?? 0),
        ]),
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: '#818CF8', textColor: '#FFFFFF' },
        theme: 'striped',
      })
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor('#AAAAAA')
      doc.text(
        `Generated by MindLens  ·  Page ${i} of ${totalPages}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
    }

    doc.save(`mindlens-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  async function handleExport(fmt: ExportFormat) {
    setExportingFormat(fmt)
    try {
      const data = await fetchAllData()
      if (fmt === 'json') await exportJSON(data)
      else if (fmt === 'csv') await exportCSV(data)
      else if (fmt === 'txt') await exportTXT(data)
      else if (fmt === 'pdf') await exportPDF(data)
      setExportDone(fmt)
      setTimeout(() => setExportDone(null), 2500)
    } finally {
      setExportingFormat(null)
    }
  }

  async function handleSaveGoals() {
    const filteredPositive = goalsPositiveHabits.map((h) => h.trim()).filter(Boolean)
    const filteredNegative = goalsNegativeHabits.map((h) => h.trim()).filter(Boolean)
    setGoalsSaving(true)
    try {
      await fetch('/api/goals/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focus_areas: goalsFocusAreas,
          positive_habits: filteredPositive,
          negative_habits: filteredNegative,
        }),
      })
      localStorage.setItem('stride_goals_set', 'true')
      setGoalsSaved(true)
      setTimeout(() => setGoalsSaved(false), 2500)
    } finally {
      setGoalsSaving(false)
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
      if (res.ok) router.push('/auth')
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

  const exportFormats: { fmt: ExportFormat; icon: string; label: string; sub: string }[] = [
    { fmt: 'json', icon: '📄', label: 'JSON', sub: 'Raw data' },
    { fmt: 'csv', icon: '📊', label: 'CSV', sub: 'Spreadsheet' },
    { fmt: 'pdf', icon: '📑', label: 'PDF', sub: 'Readable report' },
    { fmt: 'txt', icon: '📋', label: 'TXT', sub: 'Plain text' },
  ]

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

      {/* My Goals */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="mb-0.5 text-sm font-medium text-[var(--text-primary)]">My Goals</p>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          MindLens uses these to give you more relevant wellbeing insights and classifications.
        </p>

        {/* Focus areas */}
        <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Focus areas (up to 3)</p>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((area) => {
            const isSelected = goalsFocusAreas.includes(area.value)
            return (
              <motion.button
                key={area.value}
                type="button"
                onClick={() => toggleGoalsFocusArea(area.value)}
                animate={{
                  backgroundColor: isSelected ? '#818CF8' : 'transparent',
                  borderColor: isSelected ? '#818CF8' : 'var(--border)',
                  scale: isSelected ? 1.04 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="rounded-full border px-3 py-1 text-xs font-medium"
                style={{ color: isSelected ? '#ffffff' : 'var(--text-muted)' }}
              >
                {area.label}
              </motion.button>
            )
          })}
        </div>

        {/* Positive habits */}
        <p className="mb-2 mt-4 text-xs font-medium text-[var(--text-secondary)]">
          Habits to build or maintain
        </p>
        <div className="space-y-2">
          {(['e.g. work on my project', 'e.g. read every day', 'e.g. exercise'] as const).map(
            (placeholder, i) => (
              <input
                key={i}
                type="text"
                value={goalsPositiveHabits[i]}
                onChange={(e) =>
                  setGoalsPositiveHabits((prev) => prev.map((h, idx) => (idx === i ? e.target.value : h)))
                }
                placeholder={placeholder}
                maxLength={80}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)]/60"
              />
            )
          )}
        </div>

        {/* Negative habits */}
        <p className="mb-2 mt-4 text-xs font-medium text-[var(--text-secondary)]">
          Habits to reduce or quit
        </p>
        <div className="space-y-2">
          {(['e.g. snacking', 'e.g. late night screen time'] as const).map((placeholder, i) => (
            <input
              key={i}
              type="text"
              value={goalsNegativeHabits[i]}
              onChange={(e) =>
                setGoalsNegativeHabits((prev) => prev.map((h, idx) => (idx === i ? e.target.value : h)))
              }
              placeholder={placeholder}
              maxLength={80}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)]/60"
            />
          ))}
        </div>

        {/* Save button */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSaveGoals}
            disabled={goalsSaving}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {goalsSaving ? 'Saving…' : 'Save Goals'}
          </button>
          <AnimatePresence>
            {goalsSaved && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-[var(--positive)]"
              >
                Goals updated ✓
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* About */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <button
          onClick={() => setShowAbout(!showAbout)}
          className="flex w-full items-center justify-between p-5"
        >
          <span className="text-sm font-medium text-[var(--text-primary)]">About MindLens</span>
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
              <div className="border-t border-[var(--border)] px-5 pb-5 pt-4 space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                <p>
                  MindLens is a student mental health companion that works through your daily
                  journal. Write about your day in plain English — MindLens reads it, tracks
                  your stress and mood automatically, detects early warning signs, and guides
                  you with evidence-based coping tools.
                </p>
                <p>No rigid forms. No checkboxes. No pressure.</p>
                <p className="font-medium text-[var(--text-primary)]">Your daily mental health companion.</p>
              </div>
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

      {/* Export */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="mb-0.5 text-sm font-medium text-[var(--text-primary)]">Export My Data</p>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          Download all your journal entries and insights
        </p>
        <div className="grid grid-cols-4 gap-2">
          {exportFormats.map(({ fmt, icon, label, sub }) => {
            const busy = exportingFormat === fmt
            const done = exportDone === fmt
            return (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                disabled={!!exportingFormat}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] px-2 py-3 transition-colors hover:border-[var(--accent)]/40 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
                ) : done ? (
                  <Check size={18} className="text-[var(--positive)]" />
                ) : (
                  <span className="text-lg">{icon}</span>
                )}
                <span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{sub}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--card-elevated)]"
        >
          <LogOut size={16} />
          Sign Out
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-[var(--negative)]/20 bg-[var(--card)] px-5 py-4 text-sm font-medium text-[var(--negative)] transition-colors hover:bg-[var(--negative)]/5"
        >
          <Trash2 size={16} />
          Delete Account
        </button>
      </div>

      {/* Version */}
      <p className="pb-4 text-center text-xs text-[var(--text-muted)]">MindLens v1.0.0</p>

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
