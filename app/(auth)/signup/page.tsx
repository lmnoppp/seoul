'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseClient'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      const supabase = supabaseBrowser()
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) {
        setError(authError.message)
        return
      }
      setMessage('Inscription réussie. Vérifiez votre email si nécessaire.')
    } catch (err: any) {
      setError(err?.message ?? 'Configuration manquante (.env).')
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-md mx-auto card space-y-4">
        <h1 className="text-xl font-semibold">Créer un compte</h1>
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
          {message && <p className="text-green-700 text-sm">{message}</p>}
          <button className="btn w-full" type="submit">S'inscrire</button>
        </form>
      </div>
    </main>
  )
}


