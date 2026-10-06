revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, app_role) from public, anon;
create policy "photos public read" on storage.objects for select using (bucket_id = 'post-photos');
create policy "photos auth upload" on storage.objects for insert to authenticated with check (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);