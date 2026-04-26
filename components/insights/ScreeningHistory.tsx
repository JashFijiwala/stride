'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts'

interface ScreeningPoint {
  date: string
  phq9: number | null
  gad7: number | null
}

interface TooltipPayloadItem {
  value: number
  name: string
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-[var(--text-primary)]">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="mt-0.5">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`
}

interface ScreeningHistoryProps {
  userId: string
}

export function ScreeningHistory({ userId }: ScreeningHistoryProps) {
  const [points, setPoints] = useState<ScreeningPoint[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!userId) return

    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('screening_results')
        .select('test_type, total_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (!data) { setLoaded(true); return }

      // Group by date (one row per day, two columns phq9/gad7)
      const dateMap = new Map<string, ScreeningPoint>()
      for (const row of data) {
        const dateStr = (row.created_at as string).split('T')[0]
        const existing = dateMap.get(dateStr) ?? {
          date: formatDate(dateStr),
          phq9: null,
          gad7: null,
        }
        if (row.test_type === 'phq9') existing.phq9 = row.total_score as number
        if (row.test_type === 'gad7') existing.gad7 = row.total_score as number
        dateMap.set(dateStr, existing)
      }

      setPoints(Array.from(dateMap.values()))
      setLoaded(true)
    }

    load().catch(() => setLoaded(true))
  }, [userId])

  // Only render with 2+ entries
  if (!loaded || points.length < 2) return null

  const tickInterval = points.length > 6 ? Math.floor(points.length / 6) : 0

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Screening Score History
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={points} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          {/* Severity zone shading */}
          <ReferenceArea y1={0} y2={4} fill="rgba(34,197,94,0.07)" ifOverflow="hidden" />
          <ReferenceArea y1={5} y2={9} fill="rgba(234,179,8,0.07)" ifOverflow="hidden" />
          <ReferenceArea y1={10} y2={14} fill="rgba(249,115,22,0.07)" ifOverflow="hidden" />
          <ReferenceArea y1={15} y2={27} fill="rgba(239,68,68,0.07)" ifOverflow="hidden" />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            domain={[0, 27]}
            ticks={[0, 5, 10, 15, 20, 27]}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="phq9"
            name="PHQ-9"
            stroke="#60A5FA"
            strokeWidth={2}
            dot={{ r: 3, fill: '#60A5FA', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#60A5FA', strokeWidth: 0 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="gad7"
            name="GAD-7"
            stroke="#C084FC"
            strokeWidth={2}
            dot={{ r: 3, fill: '#C084FC', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#C084FC', strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full bg-[#60A5FA]" />
          <span className="text-[10px] text-[var(--text-muted)]">PHQ-9</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full bg-[#C084FC]" />
          <span className="text-[10px] text-[var(--text-muted)]">GAD-7</span>
        </div>
      </div>
    </div>
  )
}
