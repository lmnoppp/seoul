'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const supabase = supabaseBrowser()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
        return
      }
      router.push('/onboarding')
    } catch (err: any) {
      setError(err?.message ?? 'Configuration manquante (.env).')
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
          <button className="btn w-full" type="submit">Se connecter</button>
        </form>
      </div>
    </main>
  )
}


