import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    // Auth → userId
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin().auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    const userId = user.id

    // Trouve couple_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: coupleData, error: coupleError } = await (supabaseAdmin() as any)
      .from('couples')
      .select('id')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Couple introuvable' }, { status: 404 })
    }

    const coupleId = coupleData.id
    const now = new Date().toISOString()

    // Insert dans public.actions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: actionError } = await (supabaseAdmin() as any)
      .from('actions')
      .insert({
        couple_id: coupleId,
        user_id: userId,
        type: 'sleep',
        meta: { local_time: now },
        created_at: now
      })

    if (actionError) {
      console.error('Erreur insertion action:', actionError)
      return NextResponse.json({ error: 'Erreur enregistrement action' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, at: now })
  } catch (error) {
    console.error('Erreur /api/actions/sleep:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


