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

    // Met à jour hunger +40 (cap 100)
    const { error: updateError } = await supabaseAdmin()
      .rpc('update_neko_hunger', {
        couple_id_param: coupleData.id,
        increment_value: 40
      })

    if (updateError) {
      // Fallback: update manuel
      const { data: currentState } = await supabaseAdmin()
        .from('neko_state')
        .select('*')
        .eq('couple_id', coupleData.id)
        .single()

      const newHunger = Math.min((currentState?.hunger || 0) + 40, 100)

      const { data: state, error: manualError } = await supabaseAdmin()
        .from('neko_state')
        .update({
          hunger: newHunger,
          updated_at: now
        })
        .eq('couple_id', coupleData.id)
        .select('hunger, thirst, cleanliness, day_counter')
        .single()

      if (manualError) {
        console.error('Erreur update neko hunger:', manualError)
        return NextResponse.json({ error: 'Erreur mise à jour neko' }, { status: 500 })
      }

      return NextResponse.json(state)
    }

    // Récupère l'état mis à jour
    const { data: finalState } = await supabaseAdmin()
      .from('neko_state')
      .select('hunger, thirst, cleanliness, day_counter')
      .eq('couple_id', coupleData.id)
      .single()

    return NextResponse.json(finalState)
  } catch (error) {
    console.error('Erreur POST /api/neko/feed:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


