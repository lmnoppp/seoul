'use client'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export default function ActionsPage() {
  async function goSleep() {
    try {
      const supabase = supabaseBrowser()
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      await fetch('/api/actions/sleep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ when: new Date().toISOString() }),
      })
    } catch (err) {
      console.error(err)
      alert('Impossible d\'appeler l\'API (config .env manquante ?)')
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-xl mx-auto card space-y-3">
        <h1 className="text-xl font-semibold">Actions</h1>
        <button className="btn" onClick={goSleep}>Je vais dormir</button>
      </div>
    </main>
  )
}


