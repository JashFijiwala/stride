'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wind, Brain, Anchor, Timer, ArrowLeft, CheckCircle2, Circle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { CopingSession } from '@/lib/types'

const EXERCISES = [
  {
    href: '/coping/breathing',
    Icon: Wind,
    color: '#60A5FA',
    title: 'Box Breathing',
    description: 'Calm your nervous system with 4-4-4-4 breathing',
    tag: '2–10 min',
  },
  {
    href: '/coping/reframe',
    Icon: Brain,
    color: '#A78BFA',
    title: 'Reframe a Thought',
    description: 'Challenge anxious thoughts with a guided CBT exercise',
    tag: '5–10 min',
  },
  {
    href: '/coping/grounding',
    Icon: Anchor,
    color: '#4ADE80',
    title: '5-4-3-2-1 Grounding',
    description: 'Come back to the present moment using your senses',
    tag: '3–5 min',
  },
  {
    href: '/coping/mindfulness',
    Icon: Timer,
    color: '#FCD34D',
    title: 'Mindfulness Moment',
    description: 'Sit quietly and focus on your breath',
    tag: '3–10 min',
  },
]

const EXERCISE_LABELS: Record<string, string> = {
  breathing: 'Box Breathing',
  cbt_reframe: 'Thought Reframe',
  grounding_54321: '5-4-3-2-1 Grounding',
  muscle_relaxation: 'Muscle Relaxation',
  journaling: 'Journaling',
  mindfulness: 'Mindfulness',
}

interface CopingClientProps {
  userId: string
}

export function CopingClient({ userId }: CopingClientProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<CopingSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSessions() {
      const supabase = createClient()
      const { data } = await supabase
        .from('coping_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
      setSessions((data as CopingSession[]) ?? [])
      setLoading(false)
    }
    fetchSessions().catch(console.error)
  }, [userId])

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/today')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          aria-label="Back to check-in"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Coping Toolkit</h1>
          <p className="text-sm text-[var(--text-muted)]">Guided exercises for your wellbeing</p>
        </div>
      </div>

      {/* Exercise grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {EXERCISES.map(({ href, Icon, color, title, description, tag }) => (
          <motion.button
            key={href}
            onClick={() => router.push(href)}
            whileTap={{ scale: 0.97 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-left transition-colors hover:border-[#818CF8]/20"
          >
            <div
              className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon size={20} style={{ color }} />
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
            <div
              className="mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {tag}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Recent Activity</h2>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-[var(--card-elevated)]" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              You haven&apos;t tried any exercises yet. Give one a go!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {EXERCISE_LABELS[session.exercise_type] ?? session.exercise_type}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {format(parseISO(session.created_at), 'MMM d, yyyy · h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {session.duration_seconds != null && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {Math.max(1, Math.round(session.duration_seconds / 60))}m
                    </span>
                  )}
                  {session.completed ? (
                    <CheckCircle2 size={18} className="text-[#4ADE80]" />
                  ) : (
                    <Circle size={18} className="text-[var(--text-muted)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
