type Sender = { email: string; name?: string }

function parseSender(sender: string): Sender {
  const match = sender.match(/^(.*)\s*<([^>]+)>$/)
  if (match) {
    const name = match[1].trim()
    const email = match[2].trim()
    return name ? { email, name } : { email }
  }
  return { email: sender }
}

export async function sendEmail(toEmail: string, subject: string, html: string): Promise<{ ok: boolean }> {
  const apiKey = process.env.BREVO_API_KEY
  const senderString = process.env.EMAIL_SENDER
  
  // Si pas de BREVO_API_KEY ou pas de EMAIL_SENDER → no-op
  if (!apiKey || !senderString) {
    console.log('EMAIL_DISABLED')
    return { ok: true }
  }

  try {
    const sender = parseSender(senderString)

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender,
        to: [{ email: toEmail }],
        subject,
        html,
      }),
    })

    if (res.ok) {
      return { ok: true }
    } else {
      console.error('Erreur envoi email Brevo:', res.status, await res.text())
      return { ok: false }
    }
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return { ok: false }
  }
}


