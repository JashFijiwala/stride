'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MoodPoint } from '@/hooks/useInsights'

interface MoodTimelineProps {
  data: MoodPoint[]
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

export function MoodTimeline({ data }: MoodTimelineProps) {
  if (data.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <p className="text-sm text-[var(--text-muted)]">
          Log a few more days to see your mood timeline.
        </p>
      </div>
    )
  }

  // Show last 14 or 30 depending on data length
  const display = data.slice(-30)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Mood Score
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={display} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818CF8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            interval={display.length > 14 ? 6 : 2}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[2, 4, 6, 8, 10]}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="mood_score"
            name="Mood"
            stroke="#818CF8"
            strokeWidth={2}
            fill="url(#moodGradient)"
            dot={{ r: 3, fill: '#818CF8', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#818CF8', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
