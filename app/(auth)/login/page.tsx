'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const supabase = supabaseBrowser()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
        setNeedsConfirmation(/email not confirmed/i.test(authError.message))
        return
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

  async function resendConfirmation() {
    setResendMsg(null)
    setError(null)
    try {
      const supabase = supabaseBrowser()
      const { data, error: resendError } = await supabase.auth.resend({ type: 'signup', email })
      if (resendError) {
        setError(resendError.message)
      } else {
        setResendMsg('Email de confirmation renvoyé. Vérifie ta boîte de réception.')
      }
    } catch {
      setError('Impossible de renvoyer l’email pour le moment.')
    }
  }

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
          {needsConfirmation && (
            <div className="text-sm space-y-2">
              <button type="button" className="btn btn-secondary w-full" onClick={resendConfirmation}>
                Renvoyer l’email de confirmation
              </button>
              {resendMsg && <p className="text-green-700">{resendMsg}</p>}
            </div>
          )}
          <button className="btn w-full" type="submit">Se connecter</button>
        </form>
      </div>
    </main>
  )
}


