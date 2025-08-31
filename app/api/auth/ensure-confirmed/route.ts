import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

async function findUserIdByEmail(email: string): Promise<string | null> {
  // Recherche paginée car l'API n'a pas de getUserByEmail
  const perPage = 200
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin().auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const match = data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
    if (match) return match.id
    if (data.users.length < perPage) break
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { email?: string }
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!email) {
      return NextResponse.json({ error: 'email requis' }, { status: 400 })
    }

    const userId = await findUserIdByEmail(email)
    if (!userId) {
      // Ne révèle pas l'existence; renvoie ok pour UX simple
      return NextResponse.json({ ok: true, updated: false })
    }

    const { error } = await supabaseAdmin().auth.admin.updateUserById(userId, { email_confirm: true })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true, updated: true })
  } catch (err) {
    console.error('Erreur ensure-confirmed:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Supporte preflight et fallback simple
export async function OPTIONS() {
  return new Response(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = (searchParams.get('email') || '').trim()
    if (!email) return NextResponse.json({ ok: true, updated: false })
    const userId = await findUserIdByEmail(email)
    if (!userId) return NextResponse.json({ ok: true, updated: false })
    const { error } = await supabaseAdmin().auth.admin.updateUserById(userId, { email_confirm: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, updated: true })
  } catch (err) {
    console.error('Erreur ensure-confirmed GET:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


