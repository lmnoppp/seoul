/* eslint-disable @typescript-eslint/no-explicit-any */
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

    // Agrège notes/actions du jour par couple
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: couples, error: couplesError } = await (supabaseAdmin() as any)
      .from('couples')
      .select('id, user_a, user_b')

    if (couplesError) {
      console.error('Erreur récupération couples:', couplesError)
      return NextResponse.json({ error: 'Erreur récupération couples' }, { status: 500 })
    }

    for (const couple of couples || []) {
      try {
        // Récupère les utilisateurs avec leurs emails
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: users } = await (supabaseAdmin() as any)
          .from('users')
          .select('id, email, handle')
          .in('id', [couple.user_a, couple.user_b])

        if (!users || users.length !== 2) continue

        // Récupère les actions du jour
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: actions } = await (supabaseAdmin() as any)
          .from('actions')
          .select('type, user_id, created_at, meta')
          .eq('couple_id', couple.id)
          .gte('created_at', startOfDay)
          .lt('created_at', endOfDay)
          .order('created_at', { ascending: false })

        // Récupère les entrées de journal du jour
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: journalEntries } = await (supabaseAdmin() as any)
          .from('journal_entries')
          .select('content_text, moods, visibility, user_id, created_at')
          .eq('couple_id', couple.id)
          .gte('created_at', startOfDay)
          .lt('created_at', endOfDay)
          .order('created_at', { ascending: false })

        // Envoie un email à chaque utilisateur du couple
        for (const user of users) {
          if (!user.email) continue

          const partner = users.find((u: any) => u.id !== user.id)
          if (!partner) continue

          const userActions = actions?.filter((a: any) => a.user_id === user.id) || []
          const partnerActions = actions?.filter((a: any) => a.user_id === partner.id) || []
          const userJournalEntries = journalEntries?.filter((e: any) => e.user_id === user.id) || []
          const partnerJournalEntries = journalEntries?.filter((e: any) => e.user_id === partner.id && e.visibility === 'shared') || []

          // Construction du HTML
          let html = `
            <h2>📝 Résumé de ta journée avec ${partner.handle} !</h2>
            <p>Voici ce qui s'est passé aujourd'hui :</p>
          `

          // Actions de l'utilisateur
          if (userActions.length > 0) {
            html += `
              <h3>🎯 Tes actions :</h3>
              <ul>
                ${userActions.map((action: any) => {
                  const time = new Date(action.created_at).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                  return `<li>${time} - ${action.type}</li>`
                }).join('')}
              </ul>
            `
          }

          // Actions du partenaire
          if (partnerActions.length > 0) {
            html += `
              <h3>💕 Actions de ${partner.handle} :</h3>
              <ul>
                ${partnerActions.map((action: any) => {
                  const time = new Date(action.created_at).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                  return `<li>${time} - ${action.type}</li>`
                }).join('')}
              </ul>
            `
          }

          // Entrées de journal de l'utilisateur
          if (userJournalEntries.length > 0) {
            html += `
              <h3>📔 Tes notes :</h3>
              ${userJournalEntries.map((entry: any) => {
                const time = new Date(entry.created_at).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
                return `
                  <div style="background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 8px;">
                    <p><strong>${time}</strong></p>
                    <p>${entry.content_text || 'Aucun texte'}</p>
                    ${entry.moods && entry.moods.length > 0 ? `<p><small>Humeurs : ${entry.moods.join(', ')}</small></p>` : ''}
                  </div>
                `
              }).join('')}
            `
          }

          // Entrées de journal partagées du partenaire
          if (partnerJournalEntries.length > 0) {
            html += `
              <h3>💌 Notes partagées de ${partner.handle} :</h3>
              ${partnerJournalEntries.map((entry: any) => {
                const time = new Date(entry.created_at).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
                return `
                  <div style="background: #e8f5e8; padding: 15px; margin: 10px 0; border-radius: 8px;">
                    <p><strong>${time}</strong></p>
                    <p>${entry.content_text || 'Aucun texte'}</p>
                    ${entry.moods && entry.moods.length > 0 ? `<p><small>Humeurs : ${entry.moods.join(', ')}</small></p>` : ''}
                  </div>
                `
              }).join('')}
            `
          }

          // Si aucune activité
          if (userActions.length === 0 && partnerActions.length === 0 && 
              userJournalEntries.length === 0 && partnerJournalEntries.length === 0) {
            html += `
              <p>Pas d'activité aujourd'hui... Pourquoi ne pas écrire une petite note à ${partner.handle} ? 💕</p>
            `
          }

          html += `
            <hr style="margin: 30px 0;" />
            <p style="text-align: center; color: #666; font-size: 14px;">
              Connecte-toi sur SeoulKit pour continuer votre histoire ensemble ! ✨
            </p>
          `

          const subject = `📝 Résumé de ta journée avec ${partner.handle}`
          await sendEmail(user.email, subject, html)
        }
      } catch (coupleError) {
        console.error(`Erreur traitement couple ${couple.id}:`, coupleError)
        continue
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur cron daily-recap:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


