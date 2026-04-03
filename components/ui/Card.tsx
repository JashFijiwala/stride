interface CardProps {
  children: React.ReactNode
  className?: string
  elevated?: boolean
}

export function Card({ children, className = '', elevated = false }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-[var(--border)] p-4
        ${elevated ? 'bg-[var(--card-elevated)]' : 'bg-[var(--card)]'}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
