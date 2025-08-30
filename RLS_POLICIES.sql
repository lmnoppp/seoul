-- Activer RLS
alter table public.couples            enable row level security;
alter table public.journal_entries    enable row level security;
alter table public.journal_photos     enable row level security;
alter table public.messages           enable row level security;
alter table public.actions            enable row level security;
alter table public.neko_state         enable row level security;
alter table public.notifications_log  enable row level security;

-- Helper: fonction qui dit si l'utilisateur appartient au couple d'une ligne
create or replace function public.user_in_couple(c_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.couples c
    where c.id = c_id and auth.uid() in (c.user_a, c.user_b)
  );
$$;

-- COUPLES: lecture/écriture uniquement par A ou B
create policy couples_rw_all on public.couples
  for all
  using (auth.uid() in (user_a, user_b))
  with check (auth.uid() in (user_a, user_b));

-- JOURNAL ENTRIES
-- Lire: auteur lui-même OU partenaire si visibility='shared'
create policy journal_select on public.journal_entries
  for select
  using (
    author_id = auth.uid()
    or (public.user_in_couple(couple_id) and visibility = 'shared')
  );

-- Créer: auteur doit être membre du couple
create policy journal_insert on public.journal_entries
  for insert
  with check (public.user_in_couple(couple_id) and author_id = auth.uid());

-- Modifier/Supprimer: seulement l'auteur
create policy journal_update on public.journal_entries
  for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy journal_delete on public.journal_entries
  for delete
  using (author_id = auth.uid());

-- JOURNAL PHOTOS (dérivé de l'entrée)
create policy jphotos_select on public.journal_photos
  for select
  using (
    exists (
      select 1
      from public.journal_entries je
      where je.id = journal_photos.entry_id
        and (
          je.author_id = auth.uid()
          or (public.user_in_couple(je.couple_id) and je.visibility = 'shared')
        )
    )
  );

create policy jphotos_insert on public.journal_photos
  for insert
  with check (
    exists (
      select 1
      from public.journal_entries je
      where je.id = entry_id and je.author_id = auth.uid()
    )
  );

create policy jphotos_delete on public.journal_photos
  for delete
  using (
    exists (
      select 1
      from public.journal_entries je
      where je.id = entry_id and je.author_id = auth.uid()
    )
  );

-- MESSAGES: visibles aux deux membres du couple
create policy messages_select on public.messages
  for select using (public.user_in_couple(couple_id));

create policy messages_insert on public.messages
  for insert  with check (public.user_in_couple(couple_id));

-- ACTIONS: visibles aux deux membres du couple
create policy actions_select on public.actions
  for select using (public.user_in_couple(couple_id));

create policy actions_insert on public.actions
  for insert  with check (public.user_in_couple(couple_id));

-- NEKO STATE: visible/éditable par les deux
create policy neko_select on public.neko_state
  for select using (public.user_in_couple(couple_id));

create policy neko_upsert on public.neko_state
  for all
  using (public.user_in_couple(couple_id))
  with check (public.user_in_couple(couple_id));

-- NOTIFICATIONS LOG: lecture par destinataire ou par membre du couple (audit)
create policy notif_select on public.notifications_log
  for select using (
    to_user_id = auth.uid()
    or public.user_in_couple(couple_id)
  );

create policy notif_insert on public.notifications_log
  for insert with check (true); -- insertion côté serveur (service key)
