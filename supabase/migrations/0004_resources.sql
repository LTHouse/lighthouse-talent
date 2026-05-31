-- 0004_resources.sql — resource library: metadata table + Supabase Storage bucket.
create table public.resources (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  category      text,
  type          text,                 -- article | template | video | podcast | link | file
  description   text,
  external_url  text,                 -- for link-type resources
  storage_path  text,                 -- for uploaded files (object path in the 'resources' bucket)
  published     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index resources_category_idx on public.resources (category);

alter table public.resources enable row level security;

create policy resources_admin_select on public.resources for select to authenticated using (public.is_admin());
create policy resources_admin_insert on public.resources for insert to authenticated with check (public.is_admin());
create policy resources_admin_update on public.resources for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy resources_admin_delete on public.resources for delete to authenticated using (public.is_admin());
create policy resources_read_published on public.resources for select to authenticated using (published = true);

insert into storage.buckets (id, name, public) values ('resources', 'resources', false)
on conflict (id) do nothing;

create policy "resources_obj_read" on storage.objects for select to authenticated
  using (bucket_id = 'resources');
create policy "resources_obj_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'resources' and public.is_admin());
create policy "resources_obj_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'resources' and public.is_admin()) with check (bucket_id = 'resources' and public.is_admin());
create policy "resources_obj_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'resources' and public.is_admin());
