import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
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
    const { data: coupleData, error: coupleError } = await supabaseAdmin()
      .from('couples')
      .select('id')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Couple introuvable' }, { status: 404 })
    }

    // Récupère l'état du neko
    const { data: nekoState, error: nekoError } = await supabaseAdmin()
      .from('neko_state')
      .select('hunger, thirst, cleanliness, day_counter')
      .eq('couple_id', coupleData.id)
      .single()

    if (nekoError || !nekoState) {
      // Retourne l'état par défaut si pas encore créé
      return NextResponse.json({
        hunger: 100,
        thirst: 100,
        cleanliness: 100,
        day_counter: 0,
      })
    }

    return NextResponse.json(nekoState)
  } catch (error) {
    console.error('Erreur GET /api/neko:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


