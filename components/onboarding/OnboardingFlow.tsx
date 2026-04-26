'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SCREENS = [
  {
    emoji: '🧠',
    title: 'Welcome to Haven',
    detail:
      'Your daily mental health companion. Check in with yourself, understand your patterns, and find support when you need it.',
    buttonText: 'Get Started',
  },
  {
    emoji: '✨',
    title: 'How it works',
    steps: [
      '📝 Daily check-in — takes under 2 minutes',
      '🤖 AI analyses your wellbeing patterns',
      '📊 Track mood, stress, and sleep over time',
      '🫁 Access coping exercises anytime',
      '🆘 Get connected to help when you need it',
    ],
    buttonText: 'Next',
  },
  {
    emoji: '🔒',
    title: 'Your privacy matters',
    detail:
      'Your journal entries and screening results are completely private. We never share your data with anyone — not your college, not third parties. You can export or delete everything at any time.',
    disclaimer:
      'Haven is a screening tool, not a diagnosis. Always consult a professional for clinical advice.',
    buttonText: 'Start your journey',
  },
]

interface OnboardingFlowProps {
  onComplete: () => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)

  function next() {
    if (step < SCREENS.length - 1) {
      setStep(step + 1)
    } else {
      localStorage.setItem('stride_onboarding_complete', '1')
      onComplete()
    }
  }

  const screen = SCREENS[step]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)] px-6"
    >
      <div className="w-full max-w-sm">
        {/* Screen content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--accent)]/15"
            >
              <span className="text-5xl">{screen.emoji}</span>
            </motion.div>

            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {screen.title}
            </h1>
            {'detail' in screen && (
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                {screen.detail}
              </p>
            )}
            {'steps' in screen && (
              <ul className="mt-4 space-y-2 text-left">
                {screen.steps!.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-[var(--text-muted)]">
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {'disclaimer' in screen && screen.disclaimer && (
              <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]/70">
                {screen.disclaimer}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="mt-10 flex items-center justify-center gap-2">
          {SCREENS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 20 : 6,
                backgroundColor: i === step ? 'var(--accent)' : 'var(--border)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>

        {/* Button */}
        <motion.button
          onClick={next}
          whileTap={{ scale: 0.97 }}
          className="mt-8 w-full rounded-2xl bg-[var(--accent)] py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          {screen.buttonText}
        </motion.button>

        {/* Skip */}
        {step < SCREENS.length - 1 && (
          <button
            onClick={() => {
              localStorage.setItem('stride_onboarding_complete', '1')
              onComplete()
            }}
            className="mt-3 w-full py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            Skip
          </button>
        )}
      </div>
    </motion.div>
  )
}
