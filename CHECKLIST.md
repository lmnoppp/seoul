# Checklist déploiement

## Supabase
- [ ] Projet créé.
- [ ] DB_SCHEMA.sql exécuté sans erreur.
- [ ] RLS_POLICIES.sql exécuté.
- [ ] Storage: bucket privé `journal` créé.
- [ ] Service Role Key stockée sur Vercel (server only).

## Brevo
- [ ] Domaine expéditeur validé (ex: seoulkit.app).
- [ ] BREVO_API_KEY sur Vercel.
- [ ] Templates HTML intégrés (ou générés depuis code).

## Vercel
- [ ] Env vars:
      NEXT_PUBLIC_SUPABASE_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY
      SUPABASE_SERVICE_ROLE_KEY
      BREVO_API_KEY
      APP_URL
      EMAIL_SENDER
      CRON_SECRET
      MAX_UPLOAD_MB=10
      TZ_DEFAULT=Europe/Paris
- [ ] Scheduled Functions:
      /api/cron/neko-tick (*/60)
      /api/cron/daily-recap (0 20 * * *)  # 20:00 Europe/Paris
- [ ] Domaine relié (ex: https://seoulkit.app)

## QA final
- [ ] Parcours complet A/B OK.
- [ ] RLS vérifiées (privé vs partagé).
- [ ] Upload 10 MB OK.
- [ ] Emails SOS / Neko / Note partagée / Récap OK.
- [ ] PWA installable iOS.
