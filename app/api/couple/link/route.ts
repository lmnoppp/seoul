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

    // Parse request body
    const body = await request.json()
    const { partner_handle } = body

    if (!partner_handle) {
      return NextResponse.json({ error: 'partner_handle requis' }, { status: 400 })
    }

    // Sélectionne partnerId via public.users.handle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partnerData, error: partnerError } = await (supabaseAdmin() as any)
      .from('users')
      .select('id')
      .eq('handle', partner_handle)
      .single()

    if (partnerError || !partnerData) {
      return NextResponse.json({ error: 'Partenaire introuvable' }, { status: 404 })
    }

    const partnerId = partnerData.id

    // Vérifie si couple existe déjà (least/greatest pour éviter les doublons)
    const userA = userId < partnerId ? userId : partnerId
    const userB = userId < partnerId ? partnerId : userId

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingCouple } = await (supabaseAdmin() as any)
      .from('couples')
      .select('id, user_a, user_b')
      .eq('user_a', userA)
      .eq('user_b', userB)
      .single()

    if (existingCouple) {
      return NextResponse.json({ 
        couple: { 
          id: existingCouple.id, 
          user_a: existingCouple.user_a, 
          user_b: existingCouple.user_b 
        } 
      })
    }

    // Sinon insert dans public.couples (start_date=now())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newCouple, error: coupleError } = await (supabaseAdmin() as any)
      .from('couples')
      .insert({
        user_a: userA,
        user_b: userB,
        start_date: new Date().toISOString()
      })
      .select('id, user_a, user_b')
      .single()

    if (coupleError || !newCouple) {
      console.error('Erreur création couple:', coupleError)
      return NextResponse.json({ error: 'Erreur création couple' }, { status: 500 })
    }

    // Upsert dans public.neko_state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: nekoError } = await (supabaseAdmin() as any)
      .from('neko_state')
      .upsert({
        couple_id: newCouple.id,
        hunger: 100,
        thirst: 100,
        cleanliness: 100,
        day_counter: 0,
        updated_at: new Date().toISOString()
      })

    if (nekoError) {
      console.error('Erreur création neko_state:', nekoError)
      // On continue même si l'erreur neko, le couple est créé
    }

    return NextResponse.json({ 
      couple: { 
        id: newCouple.id, 
        user_a: newCouple.user_a, 
        user_b: newCouple.user_b 
      } 
    })
  } catch (error) {
    console.error('Erreur /api/couple/link:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
