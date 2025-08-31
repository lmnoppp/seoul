'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      // Force confirm côté serveur pour éliminer l'erreur "Email not confirmed"
      await fetch('/api/auth/ensure-confirmed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const supabase = supabaseBrowser()
      let { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        // Si erreur de confirmation → retry après reconfirm serveur
        if (/email\s*not\s*confirmed/i.test(authError.message || '')) {
          try {
            await fetch('/api/auth/ensure-confirmed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            })
            await new Promise((r) => setTimeout(r, 400))
            const retry = await supabase.auth.signInWithPassword({ email, password })
            authError = retry.error || null
          } catch {}
        }
        if (authError) {
          setError(authError.message)
          return
        }
      }
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (token) {
          await fetch('/api/me/init', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          })
        }
      } catch {
        // ignore
      }
      router.push('/onboarding')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Configuration manquante (.env).')
    }
  }

  // Hook: si l'utilisateur est déjà connecté (SIGNED_IN), init profil automatiquement
  useEffect(() => {
    const supabase = supabaseBrowser()
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        try {
          await fetch('/api/me/init', {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
        } catch {}
      }
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-md mx-auto card space-y-4">
        <h1 className="text-xl font-semibold">Connexion</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border border-rose200 rounded-lg p-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full border border-rose200 rounded-lg p-2"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="btn w-full" type="submit">Se connecter</button>
        </form>
      </div>
    </main>
  )
}


