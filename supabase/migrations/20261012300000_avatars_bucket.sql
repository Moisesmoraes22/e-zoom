-- Profile photos. One small JPEG per user (the site crops it to a 256 px square and re-draws it, which also
-- drops GPS and device data). Public to read by URL, never listable; each user writes, replaces and
-- deletes only inside their own folder: <user_id>/<timestamp>.jpg. The URL is kept in the user's
-- metadata (avatar_url), next to full_name.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/jpeg'])
on conflict (id) do nothing;

create policy avatars_upload_own_folder on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete_own_folder on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
