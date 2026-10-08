-- Moderation of comments by the site's admins, done with the admin's own session (no service key
-- in the web app). Who is an admin is a row in public.admins, added by hand in the database.

create table public.admins (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
-- A signed-in user can only see whether THEY are an admin (their own row); nobody can write.
grant select on public.admins to authenticated;
create policy admins_read_self on public.admins
  for select to authenticated using ((select auth.uid()) = user_id);

-- Admins read everything (hidden comments, photos, reports) ...
create policy comments_admin_read on public.comments
  for select to authenticated using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy comment_media_admin_read on public.comment_media
  for select to authenticated using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
grant select on public.comment_reports to authenticated;
create policy comment_reports_admin_read on public.comment_reports
  for select to authenticated using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- ... hide or restore a comment (only these two columns) ...
grant update (status, reports_count) on public.comments to authenticated;
create policy comments_admin_update on public.comments
  for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- ... and delete any comment and its photos. (The delete grant on comments already exists.)
create policy comments_admin_delete on public.comments
  for delete to authenticated using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy comment_media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'comment-media' and exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
