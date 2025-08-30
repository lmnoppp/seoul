import Link from 'next/link'

export default function Page() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-xl mx-auto card space-y-4">
        <h1 className="text-2xl font-semibold">SeoulKit</h1>
        <p className="text-choco/80">Starter Next.js + Tailwind + Supabase</p>
        <div className="flex gap-3">
          <Link className="btn" href="/signup">Créer un compte</Link>
          <Link className="btn-outline" href="/login">Se connecter</Link>
        </div>
      </div>
    </main>
  )
}


