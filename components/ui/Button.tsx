import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: React.ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-white hover:opacity-90',
  secondary:
    'border border-[var(--border)] bg-[var(--card-elevated)] text-[var(--text-primary)] hover:bg-[var(--border)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--card-elevated)] hover:text-[var(--text-primary)]',
  danger:
    'bg-[var(--negative)]/15 text-[var(--negative)] hover:bg-[var(--negative)]/25',
}

export function Button({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium
        transition-colors disabled:opacity-40
        ${VARIANT_CLASSES[variant]}
        ${className}
      `}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </motion.button>
  )
}
