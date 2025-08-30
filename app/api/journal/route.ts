import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail } from '@/lib/brevo'
import { randomUUID } from 'crypto'

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
    const { searchParams } = new URL(request.url)
    const day = searchParams.get('day')

    // Trouve couple_id
    const { data: coupleData, error: coupleError } = await supabaseAdmin()
      .from('couples')
      .select('id')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ entries: [] })
    }

    let query = supabaseAdmin()
      .from('journal_entries')
      .select(`
        id,
        content_text,
        moods,
        visibility,
        created_at,
        user_id,
        journal_photos (
          id,
          file_path,
          file_name
        )
      `)
      .eq('couple_id', coupleData.id)
      .or(`visibility.eq.shared,user_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (day) {
      const startOfDay = `${day}T00:00:00.000Z`
      const endOfDay = `${day}T23:59:59.999Z`
      query = query
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
    }

    const { data: entries, error: entriesError } = await query

    if (entriesError) {
      console.error('Erreur récupération entries:', entriesError)
      return NextResponse.json({ error: 'Erreur récupération entries' }, { status: 500 })
    }

    return NextResponse.json({ entries: entries || [] })
  } catch (error) {
    console.error('Erreur GET /api/journal:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

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
    const { content_text, moods = [], visibility = 'private', photos = [] } = body

    // Limite de taille totale des uploads base64
    const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 10)
    const maxBytes = maxUploadMb * 1024 * 1024
    let totalBytes = 0
    if (Array.isArray(photos)) {
      for (const p of photos) {
        const base64: unknown = p?.file_data
        if (typeof base64 === 'string' && base64.length > 0) {
          const payload = base64.includes(',') ? base64.split(',')[1] : base64
          try {
            totalBytes += Buffer.from(payload, 'base64').length
          } catch {}
        }
      }
    }
    if (totalBytes > maxBytes) {
      return NextResponse.json({ error: 'Payload Too Large' }, { status: 413 })
    }

    // Trouve couple_id
    const { data: coupleData, error: coupleError } = await supabaseAdmin()
      .from('couples')
      .select('id, user_a, user_b')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Couple introuvable' }, { status: 404 })
    }

    const coupleId = coupleData.id
    const entryId = randomUUID()
    const now = new Date().toISOString()

    // Insert dans public.journal_entries
    const { error: entryError } = await supabaseAdmin()
      .from('journal_entries')
      .insert({
        id: entryId,
        couple_id: coupleId,
        user_id: userId,
        content_text: content_text || '',
        moods: moods,
        visibility: visibility,
        created_at: now
      })

    if (entryError) {
      console.error('Erreur insertion entry:', entryError)
      return NextResponse.json({ error: 'Erreur création entry' }, { status: 500 })
    }

    // Upload photos → Supabase storage 'journal/{YYYY}/{MM}/{entryId}/{filename}'
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    
    for (const photo of photos) {
      const { file_name, file_data } = photo // On assume que file_data est en base64
      
      if (file_name && file_data) {
        const storagePath = `journal/${year}/${month}/${entryId}/${file_name}`
        
        try {
          // Convert base64 to buffer
          const buffer = Buffer.from(file_data.split(',')[1] || file_data, 'base64')
          
          const { error: uploadError } = await supabaseAdmin()
            .storage
            .from('journal')
            .upload(storagePath, buffer, {
              contentType: photo.content_type || 'image/jpeg'
            })

          if (uploadError) {
            console.error('Erreur upload photo:', uploadError)
            continue // Continue avec les autres photos
          }

          // Insert dans public.journal_photos
          await supabaseAdmin()
            .from('journal_photos')
            .insert({
              journal_entry_id: entryId,
              file_path: storagePath,
              file_name: file_name
            })
        } catch (photoError) {
          console.error('Erreur traitement photo:', photoError)
          continue
        }
      }
    }

    // Si visibility=shared → sendEmail(partnerEmail, sujet, html)
    if (visibility === 'shared') {
      const partnerId = coupleData.user_a === userId ? coupleData.user_b : coupleData.user_a
      
      const { data: partnerData } = await supabaseAdmin()
        .from('users')
        .select('email')
        .eq('id', partnerId)
        .single()

      if (partnerData?.email) {
        const subject = '💕 Nouvelle note partagée de ton partenaire'
        const html = `
          <h2>Ton partenaire a partagé une nouvelle note avec toi !</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Contenu :</strong></p>
            <p>${content_text || 'Aucun texte'}</p>
            ${moods.length > 0 ? `<p><strong>Humeurs :</strong> ${moods.join(', ')}</p>` : ''}
          </div>
          <p>Connecte-toi sur SeoulKit pour voir la note complète !</p>
        `
        
        await sendEmail(partnerData.email, subject, html)
      }
    }

    return NextResponse.json({ id: entryId })
  } catch (error) {
    console.error('Erreur POST /api/journal:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


