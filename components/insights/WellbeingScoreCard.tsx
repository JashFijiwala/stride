'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface SeverityInfo {
  label: string
  textColor: string
  borderColor: string
}

function getSeverity(score: number): SeverityInfo {
  if (score <= 4)
    return {
      label: 'Minimal symptoms',
      textColor: 'text-green-500',
      borderColor: 'border-l-green-500',
    }
  if (score <= 9)
    return {
      label: 'Mild symptoms',
      textColor: 'text-yellow-500',
      borderColor: 'border-l-yellow-500',
    }
  if (score <= 14)
    return {
      label: 'Moderate symptoms',
      textColor: 'text-orange-500',
      borderColor: 'border-l-orange-500',
    }
  return {
    label: 'Significant symptoms',
    textColor: 'text-red-500',
    borderColor: 'border-l-red-500',
  }
}

interface WellbeingScoreCardProps {
  userId: string
  totalDaysLogged: number
}

export function WellbeingScoreCard({ userId, totalDaysLogged }: WellbeingScoreCardProps) {
  const router = useRouter()
  const [phq9, setPhq9] = useState<number | null>(null)
  const [gad7, setGad7] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (totalDaysLogged < 3 || !userId) {
      setLoaded(true)
      return
    }

    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mental_states')
        .select('phq9_estimate, gad7_estimate')
        .eq('user_id', userId)
        .not('phq9_estimate', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (data?.[0]) {
        setPhq9(data[0].phq9_estimate as number)
        setGad7(data[0].gad7_estimate as number | null)
      }
      setLoaded(true)
    }

    load().catch(() => setLoaded(true))
  }, [userId, totalDaysLogged])

  // Skip silently until loaded, or if no phq9 estimate exists
  if (!loaded || phq9 === null) return null

  const severity = getSeverity(phq9)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-l-4 ${severity.borderColor} border-[var(--border)] bg-[var(--card)] p-5`}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Wellbeing Estimate
      </p>

      <div className="flex items-end gap-8">
        <div>
          <p className="text-4xl font-bold text-[var(--text-primary)]">{Math.round(phq9)}</p>
          <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">PHQ-9 estimate (AI)</p>
        </div>
        {gad7 !== null && (
          <div>
            <p className="text-4xl font-bold text-[var(--text-primary)]">{Math.round(gad7)}</p>
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">GAD-7 estimate (AI)</p>
          </div>
        )}
      </div>

      <p className={`mt-3 text-sm font-medium ${severity.textColor}`}>{severity.label}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Based on your journal entries. Not a clinical diagnosis.
      </p>
      <button
        onClick={() => router.push('/screening')}
        className="mt-3 text-xs font-medium text-[var(--accent)] hover:underline"
      >
        Take a formal screening →
      </button>
    </motion.div>
  )
}
