'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { MoodPoint } from '@/hooks/useInsights'

interface RatingTrendProps {
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
          {p.name}: {p.value}/10
        </p>
      ))}
    </div>
  )
}

export function RatingTrend({ data }: RatingTrendProps) {
  const ratedData = data.filter((d) => d.self_rating !== null)

  if (ratedData.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <p className="text-sm text-[var(--text-muted)]">
          Rate a few more days to see your trend.
        </p>
      </div>
    )
  }

  const avg =
    ratedData.reduce((s, d) => s + (d.self_rating ?? 0), 0) / ratedData.length

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Wellbeing Trend
        </p>
        <span className="text-xs text-[var(--text-muted)]">
          avg {avg.toFixed(1)}/10
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart
          data={ratedData}
          margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
        >
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
            interval={ratedData.length > 14 ? 6 : 2}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[2, 4, 6, 8, 10]}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avg}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Line
            type="monotone"
            dataKey="self_rating"
            name="Wellbeing score"
            stroke="#C084FC"
            strokeWidth={2}
            dot={{ r: 3, fill: '#C084FC', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#C084FC', strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
