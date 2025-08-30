import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    // Lit Authorization header (Bearer)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Enlève "Bearer "
    
    // Vérifie user via supabaseAdmin.auth.getUser(token)
    const { data: { user }, error: authError } = await supabaseAdmin().auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    // Handle = début de l'email avant @, tronqué/pad 2..32 chars
    const emailPrefix = user.email?.split('@')[0] || 'user'
    let handle = emailPrefix.substring(0, 32) // Tronqué à 32 chars max
    if (handle.length < 2) {
      handle = handle.padEnd(2, '0') // Pad à 2 chars min
    }

    // Upsert dans public.users
    const { error: upsertError } = await supabaseAdmin()
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        handle: handle,
        pw_hash: 'supabase-auth'
      })

    if (upsertError) {
      console.error('Erreur upsert user:', upsertError)
      return NextResponse.json({ error: 'Erreur création utilisateur' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur /api/me/init:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


