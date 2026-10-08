-- Comments on offers, written by signed-in users, with up to 3 photos each.
-- Same rules as favorites: nothing is trusted from the request. user_id comes from the session,
-- the author name is set by the database from the account (first name only), the status and the
-- report counter cannot be sent, and anonymous visitors can only read visible comments.

create table public.comments (
  id            uuid        primary key default gen_random_uuid(),
  offer_id      uuid        not null references public.offers (id) on delete cascade,
  user_id       uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  author_name   text        not null default 'Cliente E-Zoom',
  body          text        not null check (char_length(btrim(body)) between 3 and 1000),
  status        text        not null default 'visible' check (status in ('visible', 'hidden')),
  reports_count integer     not null default 0,
  created_at    timestamptz not null default now()
);
create index comments_offer_idx on public.comments (offer_id, created_at desc) where status = 'visible';
create index comments_user_idx on public.comments (user_id, created_at desc);

create table public.comment_media (
  id         uuid        primary key default gen_random_uuid(),
  comment_id uuid        not null references public.comments (id) on delete cascade,
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  -- object path inside the storage bucket "comment-media": <user_id>/<random>.jpg
  path       text        not null check (path like user_id::text || '/%'),
  created_at timestamptz not null default now()
);
create index comment_media_comment_idx on public.comment_media (comment_id);

create table public.comment_reports (
  comment_id uuid        not null references public.comments (id) on delete cascade,
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  reason     text        not null default 'outro' check (reason in ('ofensivo', 'spam', 'conteudo_improprio', 'outro')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- Before a comment is stored: the name and status are the database's, and a user cannot flood.
create function public.comments_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  full_name text;
begin
  select nullif(btrim(raw_user_meta_data ->> 'full_name'), '') into full_name from auth.users where id = new.user_id;
  new.author_name := coalesce(split_part(full_name, ' ', 1), 'Cliente E-Zoom');
  new.status := 'visible';
  new.reports_count := 0;
  if (select count(*) from public.comments where user_id = new.user_id and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'comment_rate_limit' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger comments_before_insert before insert on public.comments
  for each row execute function public.comments_before_insert();

-- At most 3 photos per comment.
create function public.comment_media_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.comment_media where comment_id = new.comment_id) >= 3 then
    raise exception 'comment_media_limit' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger comment_media_before_insert before insert on public.comment_media
  for each row execute function public.comment_media_before_insert();

-- Three different people reporting a comment hides it until someone looks at it.
create function public.comment_reports_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.comments
     set reports_count = reports_count + 1,
         status = case when reports_count + 1 >= 3 then 'hidden' else status end
   where id = new.comment_id;
  return new;
end $$;
create trigger comment_reports_after_insert after insert on public.comment_reports
  for each row execute function public.comment_reports_after_insert();

-- Trigger functions are not callable through the API.
revoke execute on function public.comments_before_insert() from public, anon, authenticated;
revoke execute on function public.comment_media_before_insert() from public, anon, authenticated;
revoke execute on function public.comment_reports_after_insert() from public, anon, authenticated;

alter table public.comments enable row level security;
alter table public.comment_media enable row level security;
alter table public.comment_reports enable row level security;

revoke all on public.comments, public.comment_media, public.comment_reports from anon, authenticated;
-- Columns are explicit: the client can send only the offer and the text (and the photo path).
grant select on public.comments to anon, authenticated;
grant insert (offer_id, body) on public.comments to authenticated;
grant delete on public.comments to authenticated;
grant select on public.comment_media to anon, authenticated;
grant insert (comment_id, path) on public.comment_media to authenticated;
grant insert (comment_id, reason) on public.comment_reports to authenticated;

create policy comments_read_visible on public.comments
  for select to anon using (status = 'visible');
create policy comments_read_visible_or_own on public.comments
  for select to authenticated using (status = 'visible' or (select auth.uid()) = user_id);
create policy comments_insert_own on public.comments
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy comments_delete_own on public.comments
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy comment_media_read on public.comment_media
  for select to anon, authenticated
  using (exists (select 1 from public.comments c where c.id = comment_id and (c.status = 'visible' or c.user_id = (select auth.uid()))));
create policy comment_media_insert_own on public.comment_media
  for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (select 1 from public.comments c where c.id = comment_id and c.user_id = (select auth.uid())));

-- A report can only be about a visible comment that is not the reporter's own.
create policy comment_reports_insert on public.comment_reports
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.comments c where c.id = comment_id and c.status = 'visible' and c.user_id <> (select auth.uid()))
  );

-- Photos: JPEG only (the site re-encodes every upload, which also drops GPS data), 2 MB at most,
-- each user writes only inside their own folder. The bucket is public to read by URL, never listable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comment-media', 'comment-media', true, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create policy comment_media_upload_own_folder on storage.objects
  for insert to authenticated
  with check (bucket_id = 'comment-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy comment_media_delete_own_folder on storage.objects
  for delete to authenticated
  using (bucket_id = 'comment-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
