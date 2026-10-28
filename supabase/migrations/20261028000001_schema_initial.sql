-- =====================================================================
-- Mon Coach — schéma initial de la base Supabase (version 1)
--
-- À exécuter UNE SEULE FOIS dans Supabase : menu « SQL Editor » → « New query »,
-- coller tout ce fichier, puis « Run ».
--
-- Principe : toutes les données de l'appli (profil, mesures, séances, courses,
-- planning…) sont rangées dans une seule table « enregistrements ».
-- Chaque ligne a un « type » (ex. « mesure », « course ») et son contenu dans
-- « donnees » (format JSON). Ainsi, ajouter un champ dans l'appli ne demande
-- jamais de modifier la base : aucune synchronisation ne peut échouer pour une
-- colonne manquante.
--
-- Rien n'est jamais effacé :
--   • la suppression est « logique » (date dans deleted_at) ;
--   • chaque fois qu'une ligne est remplacée, l'ancienne version est copiée
--     dans « enregistrements_historique » ;
--   • une modification plus ancienne que celle déjà en ligne n'écrase rien :
--     elle est rangée elle aussi dans l'historique.
-- =====================================================================

-- ---------- Table principale ----------
create table if not exists public.enregistrements (
  id uuid primary key,                                   -- identifiant créé par l'appli
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete restrict,        -- propriétaire de la ligne
  type text not null,                                    -- ex. « mesure », « course »
  donnees jsonb not null default '{}'::jsonb,            -- contenu de l'enregistrement
  created_at timestamptz not null,                       -- date de création (appli)
  updated_at timestamptz not null,                       -- dernière modification (appli)
  deleted_at timestamptz,                                -- suppression logique
  recu_le timestamptz not null default now()             -- arrivée sur le serveur (sert à la synchronisation)
);

create index if not exists enregistrements_user_recu_idx
  on public.enregistrements (user_id, recu_le);
create index if not exists enregistrements_user_type_idx
  on public.enregistrements (user_id, type);

-- ---------- Historique des versions remplacées ----------
create table if not exists public.enregistrements_historique (
  numero bigint generated always as identity primary key,
  enregistrement_id uuid not null,
  user_id uuid not null references auth.users (id) on delete restrict,
  type text not null,
  donnees jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  motif text not null,                -- « remplacée » ou « plus ancienne que la version en ligne »
  archive_le timestamptz not null default now()
);

create index if not exists historique_enregistrement_idx
  on public.enregistrements_historique (user_id, enregistrement_id);

-- ---------- Journal des sauvegardes automatiques ----------
-- Rempli par la sauvegarde hebdomadaire (GitHub Actions), lu par l'écran « État des sauvegardes ».
create table if not exists public.journal_sauvegardes (
  numero bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete restrict,
  fait_le timestamptz not null default now(),
  origine text not null,              -- ex. « github-actions »
  nb_enregistrements integer,
  details jsonb not null default '{}'::jsonb
);

-- ---------- Row Level Security : chacun ne voit que ses propres lignes ----------
alter table public.enregistrements enable row level security;
alter table public.enregistrements_historique enable row level security;
alter table public.journal_sauvegardes enable row level security;

drop policy if exists "lecture de mes enregistrements" on public.enregistrements;
create policy "lecture de mes enregistrements" on public.enregistrements
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "ajout de mes enregistrements" on public.enregistrements;
create policy "ajout de mes enregistrements" on public.enregistrements
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "modification de mes enregistrements" on public.enregistrements;
create policy "modification de mes enregistrements" on public.enregistrements
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Pas de règle « delete » : personne ne peut supprimer définitivement une ligne depuis l'appli.

drop policy if exists "lecture de mon historique" on public.enregistrements_historique;
create policy "lecture de mon historique" on public.enregistrements_historique
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "lecture de mon journal de sauvegardes" on public.journal_sauvegardes;
create policy "lecture de mon journal de sauvegardes" on public.journal_sauvegardes
  for select to authenticated using (user_id = auth.uid() or user_id is null);

-- ---------- Date d'arrivée sur le serveur + archivage automatique ----------
create or replace function public.avant_modification_enregistrement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- On garde toujours une copie de la version qui va être remplacée.
  if tg_op = 'UPDATE' then
    insert into public.enregistrements_historique
      (enregistrement_id, user_id, type, donnees, created_at, updated_at, deleted_at, motif)
    values
      (old.id, old.user_id, old.type, old.donnees, old.created_at, old.updated_at, old.deleted_at, 'remplacée');
    new.user_id := old.user_id;  -- une ligne ne change jamais de propriétaire
    new.id := old.id;
  end if;
  new.recu_le := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists enregistrements_avant_modification on public.enregistrements;
create trigger enregistrements_avant_modification
  before insert or update on public.enregistrements
  for each row execute function public.avant_modification_enregistrement();

-- ---------- Envoi groupé depuis l'appli (synchronisation) ----------
-- Reçoit une liste d'enregistrements. Pour chacun :
--   • absent du serveur → ajouté ;
--   • plus récent que la version en ligne → remplace (l'ancienne part dans l'historique) ;
--   • plus ancien ou identique → rien n'est écrasé ; s'il diffère, il est rangé dans
--     l'historique, et la version en ligne est renvoyée à l'appli.
create or replace function public.pousser_enregistrements(lignes jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  l jsonb;
  existant public.enregistrements%rowtype;
  refuses jsonb := '[]'::jsonb;
  acceptes integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise';
  end if;

  for l in select * from jsonb_array_elements(lignes)
  loop
    select * into existant from public.enregistrements where id = (l->>'id')::uuid;

    if not found then
      insert into public.enregistrements (id, type, donnees, created_at, updated_at, deleted_at)
      values ((l->>'id')::uuid, l->>'type', coalesce(l->'donnees', '{}'::jsonb),
              (l->>'created_at')::timestamptz, (l->>'updated_at')::timestamptz,
              (l->>'deleted_at')::timestamptz);
      acceptes := acceptes + 1;

    elsif existant.user_id <> auth.uid() then
      raise exception 'Identifiant déjà utilisé par un autre compte';

    elsif (l->>'updated_at')::timestamptz > existant.updated_at then
      update public.enregistrements
         set type = l->>'type',
             donnees = coalesce(l->'donnees', '{}'::jsonb),
             updated_at = (l->>'updated_at')::timestamptz,
             deleted_at = (l->>'deleted_at')::timestamptz
       where id = existant.id;
      acceptes := acceptes + 1;

    else
      -- Version envoyée plus ancienne (ou de même date) : on ne remplace rien.
      if existant.donnees is distinct from coalesce(l->'donnees', '{}'::jsonb)
         or existant.deleted_at is distinct from (l->>'deleted_at')::timestamptz then
        insert into public.enregistrements_historique
          (enregistrement_id, user_id, type, donnees, created_at, updated_at, deleted_at, motif)
        values
          (existant.id, auth.uid(), l->>'type', coalesce(l->'donnees', '{}'::jsonb),
           (l->>'created_at')::timestamptz, (l->>'updated_at')::timestamptz,
           (l->>'deleted_at')::timestamptz, 'plus ancienne que la version en ligne');
      end if;
      refuses := refuses || jsonb_build_array(to_jsonb(existant) - 'user_id');
    end if;
  end loop;

  return jsonb_build_object('acceptes', acceptes, 'versions_en_ligne', refuses);
end;
$$;

-- L'historique n'est écrit que par les fonctions ci-dessus (jamais directement par l'appli).
grant execute on function public.pousser_enregistrements(jsonb) to authenticated;
revoke all on function public.avant_modification_enregistrement() from public, anon, authenticated;

-- La fonction d'envoi tourne avec les droits de l'utilisatrice : elle a besoin d'ajouter
-- dans l'historique les versions plus anciennes. On l'autorise uniquement pour ses lignes.
drop policy if exists "archivage de mes versions" on public.enregistrements_historique;
create policy "archivage de mes versions" on public.enregistrements_historique
  for insert to authenticated with check (user_id = auth.uid());
