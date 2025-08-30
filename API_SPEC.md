# SeoulKit — API (Next.js App Router)

## Auth (Supabase gère la création du user; miroir `users` maintenu côté serveur)

### POST /api/auth/signup
Body: { email: string, password: string, handle: string }
-> 200 { ok: true }
Errors: 400 (handle invalide), 409 (email/handle déjà pris)

### POST /api/auth/login
Body: { email: string, password: string }
-> 200 { ok: true, accessToken: string }
Errors: 401

---

## Couple

### POST /api/couple/link
Body: { partner_handle: string }
Effet: si partner existe et n’a pas encore de couple avec toi → crée/retourne couple
-> 200 { couple: {...} }
Errors: 404 (partner inconnu), 409 (couple déjà lié)

### GET /api/couple/me
Auth required
-> 200 { couple: {...}, me: {...}, partner: {...} }
-> 404 si pas encore lié

---

## Home

### GET /api/home/badges
-> 200 {
  new_messages: number,
  new_shared_notes: number,
  neko_low: boolean,
  sos_flags: number
}

### GET /api/home/sleep-last
-> 200 { time?: string }   // ISO; null s’il n’y en a pas <24h

---

## Journal

### POST /api/journal
Body:
{
  content_text?: string,
  moods: string[],                    // ["triste","joyeuse",...]
  visibility: "private"|"shared",
  photos?: Array<{ name: string, base64: string }>
}
-> 200 { id: string }
Notes:
- Upload photos: générer noms, uploader dans bucket `journal`, créer `journal_photos`.

### GET /api/journal?day=YYYY-MM-DD
-> 200 { entries: Entry[] }   // filtrées par RLS (privé/partagé)

### GET /api/journal/feed?author=me|partner&mood=&from=&to=
-> 200 { entries: Entry[] }

---

## Actions

### POST /api/actions/sleep
Body: {}
Effet: log `sleep`, stocker heure locale envoyée par client (meta.local_time)
-> 200 { ok: true, at: string }

### POST /api/actions/eat
Body: { text?: string, photo?: { name, base64 } }
-> 200 { ok: true }

### POST /api/actions/sos
Body: { text?: string }
Effet: mail immédiat
-> 200 { ok: true }

---

## Neko

### GET /api/neko
-> 200 { hunger:number, thirst:number, cleanliness:number, day_counter:number }

### POST /api/neko/feed
### POST /api/neko/water
### POST /api/neko/bath
Body: {}
Effet: +40 (capé 100) sur jauge concernée; update `updated_at`
-> 200 { hunger, thirst, cleanliness }

---

## Messages

### POST /api/message
Body: { body: string, kind: "text"|"sticker" }
-> 200 { id }

### GET /api/message/feed?cursor=
-> 200 { items: [...], nextCursor?: string }

---

## Cron (protégés)
Header: x-cron-secret: <CRON_SECRET>

### POST /api/cron/neko-tick
Effet: toutes les heures → -5 sur jauges; si une <20% → email “Neko”

### POST /api/cron/daily-recap
Effet: 20:00 Europe/Paris → email récap par couple
