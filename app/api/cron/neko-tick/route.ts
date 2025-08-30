import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail } from '@/lib/brevo'

export async function POST(request: NextRequest) {
  try {
    // Vérifie header x-cron-secret
    const cronSecret = request.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET
    
    if (!expectedSecret || cronSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
    }

    let count = 0

    // Pour chaque couple: hunger/thirst/cleanliness -= 5 (min 0)
    const { data: couples, error: couplesError } = await supabaseAdmin()
      .from('couples')
      .select('id, user_a, user_b')

    if (couplesError) {
      console.error('Erreur récupération couples:', couplesError)
      return NextResponse.json({ error: 'Erreur récupération couples' }, { status: 500 })
    }

    for (const couple of couples || []) {
      try {
        // Récupère l'état actuel du neko
        const { data: currentState } = await supabaseAdmin()
          .from('neko_state')
          .select('hunger, thirst, cleanliness, day_counter')
          .eq('couple_id', couple.id)
          .single()

        if (!currentState) continue

        const newHunger = Math.max((currentState.hunger || 0) - 5, 0)
        const newThirst = Math.max((currentState.thirst || 0) - 5, 0)
        const newCleanliness = Math.max((currentState.cleanliness || 0) - 5, 0)

        // Met à jour l'état
        await supabaseAdmin()
          .from('neko_state')
          .update({
            hunger: newHunger,
            thirst: newThirst,
            cleanliness: newCleanliness,
            updated_at: new Date().toISOString()
          })
          .eq('couple_id', couple.id)

        count++

        // Si une jauge <20 → sendEmail
        if (newHunger < 20 || newThirst < 20 || newCleanliness < 20) {
          // Récupère les emails des utilisateurs du couple
          const { data: users } = await supabaseAdmin()
            .from('users')
            .select('email')
            .in('id', [couple.user_a, couple.user_b])

          for (const user of users || []) {
            if (user.email) {
              const subject = '🐱 Ton neko a besoin d\'attention !'
              const problems = []
              if (newHunger < 20) problems.push('faim')
              if (newThirst < 20) problems.push('soif')
              if (newCleanliness < 20) problems.push('propreté')

              const html = `
                <h2>Ton petit neko a besoin de toi ! 🐱</h2>
                <p>Les jauges suivantes sont critiques :</p>
                <ul>
                  ${problems.map(p => `<li><strong>${p}</strong></li>`).join('')}
                </ul>
                <p>Connecte-toi vite sur SeoulKit pour t'occuper de ton neko !</p>
                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                  État actuel :<br/>
                  🍽️ Faim : ${newHunger}/100<br/>
                  💧 Soif : ${newThirst}/100<br/>
                  🛁 Propreté : ${newCleanliness}/100
                </p>
              `
              
              await sendEmail(user.email, subject, html)
            }
          }
        }
      } catch (coupleError) {
        console.error(`Erreur traitement couple ${couple.id}:`, coupleError)
        continue
      }
    }

    return NextResponse.json({ ok: true, count })
  } catch (error) {
    console.error('Erreur cron neko-tick:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


