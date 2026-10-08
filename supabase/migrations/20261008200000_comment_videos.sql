-- Videos in comments: one per comment, up to 15 MB, MP4 only. They live in their own bucket so the
-- photo bucket keeps its 2 MB / JPEG-only rule. The site erases the location data before upload.

alter table public.comment_media add column kind text not null default 'photo' check (kind in ('photo', 'video'));
grant insert (kind) on public.comment_media to authenticated;

-- Limits per comment: 3 photos and 1 video.
create or replace function public.comment_media_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $fn$
declare
  max_allowed integer := 3;
begin
  if new.kind = 'video' then
    max_allowed := 1;
  end if;
  if (select count(*) from public.comment_media where comment_id = new.comment_id and kind = new.kind) >= max_allowed then
    raise exception 'comment_media_limit' using errcode = 'P0001';
  end if;
  return new;
end
$fn$;
revoke execute on function public.comment_media_before_insert() from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comment-videos', 'comment-videos', true, 15728640, array['video/mp4'])
on conflict (id) do nothing;

create policy comment_videos_upload_own_folder on storage.objects
  for insert to authenticated
  with check (bucket_id = 'comment-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy comment_videos_delete_own_folder on storage.objects
  for delete to authenticated
  using (bucket_id = 'comment-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy comment_videos_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'comment-videos' and exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
