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
    const { data: coupleData, error: coupleError } = await supabaseAdmin()
      .from('couples')
      .select('id')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Couple introuvable' }, { status: 404 })
    }

    const now = new Date().toISOString()

    // Récupère l'état actuel et met à jour cleanliness +40 (cap 100)
    const { data: currentState } = await supabaseAdmin()
      .from('neko_state')
      .select('*')
      .eq('couple_id', coupleData.id)
      .single()

    const newCleanliness = Math.min((currentState?.cleanliness || 0) + 40, 100)

    const { data: state, error: updateError } = await supabaseAdmin()
      .from('neko_state')
      .update({
        cleanliness: newCleanliness,
        updated_at: now
      })
      .eq('couple_id', coupleData.id)
      .select('hunger, thirst, cleanliness, day_counter')
      .single()

    if (updateError) {
      console.error('Erreur update neko cleanliness:', updateError)
      return NextResponse.json({ error: 'Erreur mise à jour neko' }, { status: 500 })
    }

    return NextResponse.json(state)
  } catch (error) {
    console.error('Erreur POST /api/neko/bath:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


