# Plan de tests V1

## Auth & Couple
- [ ] Signup A/B → comptes créés.
- [ ] Link couple (handle) → couple unique, impossible de dupliquer (ordre inversé).
- [ ] RLS: A ne peut pas lire entries privées de B.

## Journal
- [ ] Créer note privée → visible seulement auteur.
- [ ] Créer note partagée → l’autre reçoit email + badge.
- [ ] Upload 6 photos (≤10 MB) → ok; HEIC rejeté/converti selon impl.
- [ ] Filtre par mood/date/auteur → résultats corrects.

## Galerie
- [ ] Affiche uniquement photos des notes partagées (deux côtés).
- [ ] Tri/scroll responsive.

## Actions
- [ ] Je dors → pas de mail; bandeau à l’ouverture <24h chez l’autre.
- [ ] J’ai mangé → ping + (option) texte/photo → visible dans historique; inclus dans récap.
- [ ] SOS → email immédiat + badge rouge.

## Neko
- [ ] Tick horaire: −5 sur jauges; jamais <0.
- [ ] <20% → email Neko à Léo.
- [ ] feed/water/bath: +40 capé 100.
- [ ] Si les 3 ≥80% au moins une fois/jour → `day_counter +1` à 23:59 Paris.

## Mails
- [ ] Brevo envoie bien (domains vérifiés, sender ok).
- [ ] Récap 20:00 Paris: chiffres cohérents (notes/eat/sleep/neko).

## PWA
- [ ] Manifest ok, ajout écran d’accueil iOS.
- [ ] Offline shell minimal (app se charge; data online).
