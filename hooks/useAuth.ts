'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store/useStore'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const router = useRouter()
  const { setUser } = useStore()
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [router, setUser])

  const signInWithGoogle = useCallback(async () => {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      return false
    }
    router.push('/today')
    return true
  }, [router])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      return false
    }
    return true
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }, [router])

  return {
    user: authUser,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }
}
