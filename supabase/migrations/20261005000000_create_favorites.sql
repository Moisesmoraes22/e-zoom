-- Favorites of signed-in users (anonymous visitors keep theirs in the browser).
-- One row = one offer saved by one user. user_id is filled by the database from the
-- session (auth.uid()), never taken from the request body.
create table public.favorites (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  offer_id   uuid        not null references public.offers (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- the same offer cannot be saved twice by the same user (makes the merge idempotent)
  primary key (user_id, offer_id)
);

-- supports ON DELETE CASCADE from offers
create index favorites_offer_id_idx on public.favorites (offer_id);

alter table public.favorites enable row level security;

-- Grants are explicit: no access for anon, and no UPDATE for anyone (a favorite is
-- either there or not).
revoke all on public.favorites from anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;

create policy favorites_select_own on public.favorites
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy favorites_insert_own on public.favorites
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy favorites_delete_own on public.favorites
  for delete to authenticated
  using ((select auth.uid()) = user_id);
