'use client'

interface WeightInputProps {
  value: string
  onChange: (v: string) => void
}

export function WeightInput({ value, onChange }: WeightInputProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="weight"
        className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap"
      >
        Weight (optional)
      </label>
      <div className="flex items-center gap-1">
        <input
          id="weight"
          type="number"
          step="0.1"
          min="20"
          max="300"
          placeholder="—"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)]"
        />
        <span className="text-sm text-[var(--text-muted)]">kg</span>
      </div>
    </div>
  )
}
