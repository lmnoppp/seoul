Pages : login, signup, onboarding, home, journal (list/new), gallery, neko, actions, settings.

Composants :

JournalComposer: textarea + upload + mood picker + toggle privé/public.

PhotoGrid: galerie responsive.

MoodPicker: 6 moods figés.

NekoPanel: 3 jauges + boutons + animations CSS simples.

ActionButtons: dormir, manger, SOS.

Badge: affichage nombre notifications.

Logique :

Realtime pour badges.

Local state pour composer.

Upload → Supabase Storage + ref DB.