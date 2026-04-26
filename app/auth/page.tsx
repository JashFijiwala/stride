'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

export default function AuthPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, error, loading } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    if (isSignUp) {
      const ok = await signUpWithEmail(email, password)
      if (ok) setEmailSent(true)
    } else {
      await signInWithEmail(email, password)
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#818CF8]/15">
            <span className="text-3xl font-bold text-[#818CF8]">S</span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Haven</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Your safe space to breathe
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          {emailSent ? (
            <div className="py-4 text-center">
              <div className="mb-3 text-4xl">📬</div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                We sent a confirmation link to <strong>{email}</strong>. Click it
                to complete sign up.
              </p>
            </div>
          ) : (
            <>
              {/* Google button */}
              <button
                onClick={signInWithGoogle}
                disabled={loading || submitting}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--border)] disabled:opacity-50"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-xs text-[var(--text-muted)]">or</span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)]"
                  />
                </div>

                {error && (
                  <p className="rounded-xl bg-[var(--negative)]/10 px-3 py-2 text-xs text-[var(--negative)]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              {/* Toggle */}
              <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
