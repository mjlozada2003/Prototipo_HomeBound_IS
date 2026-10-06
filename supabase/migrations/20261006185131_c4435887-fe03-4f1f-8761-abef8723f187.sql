create type public.app_role as enum ('admin','user');
create type public.post_kind as enum ('perdido','encontrado');
create type public.post_category as enum ('mascotas','objetos');

create table public.profiles (
  id uuid primary key,
  display_name text not null,
  created_at timestamptz not null default now()
);
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  kind post_kind not null,
  category post_category not null,
  subcategory text not null,
  title text not null check (char_length(trim(title)) between 3 and 100),
  description text not null check (char_length(trim(description)) between 10 and 1000),
  event_date date not null,
  location text not null check (char_length(trim(location)) between 2 and 120),
  photo_url text not null,
  contact text,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  constraint subcat_matches check (
    (category = 'mascotas' and subcategory in ('perro','gato','otra_mascota')) or
    (category = 'objetos' and subcategory in ('documentos','electronicos','llaves','otro_objeto'))
  ),
  constraint contact_required_lost check (kind = 'encontrado' or (contact is not null and char_length(trim(contact)) >= 5))
);
create unique index posts_no_duplicates on public.posts (user_id, lower(trim(title)), kind, category, event_date);
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "posts public read" on public.posts for select using (true);
create policy "posts insert own" on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "posts update own" on public.posts for update to authenticated using (auth.uid() = user_id);
create policy "posts delete own" on public.posts for delete to authenticated using (auth.uid() = user_id);

insert into public.posts (kind, category, subcategory, title, description, event_date, location, photo_url, contact, resolved) values
('perdido','mascotas','perro','Max, golden retriever','Perro golden de 4 años, collar rojo, muy amigable. Responde a su nombre.', current_date - 2, 'Sopocachi, La Paz','https://images.unsplash.com/photo-1552053831-71594a27632d?w=800','WhatsApp 70011223', false),
('encontrado','mascotas','gato','Gatita atigrada en la plaza','Encontré una gatita atigrada gris, parece doméstica y está bien cuidada.', current_date - 1, 'Plaza Avaroa','https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800','Llamar 71234567', false),
('perdido','objetos','documentos','Billetera café con carnet','Billetera de cuero café con carnet de identidad y tarjetas a nombre de Ana R.', current_date - 3, 'Teleférico línea amarilla','https://images.unsplash.com/photo-1627123424574-724758594e93?w=800','ana.r@correo.com', false),
('encontrado','objetos','llaves','Llavero con 3 llaves','Llavero azul con tres llaves y un mini peluche. Lo dejé en portería.', current_date - 4, 'Av. 6 de Agosto','https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800', null, false),
('perdido','objetos','electronicos','Audífonos inalámbricos blancos','Estuche blanco con audífonos, tiene un sticker de estrella.', current_date - 5, 'Universidad, Monoblock','https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800','Telegram @lucas_lp', false),
('encontrado','mascotas','perro','Cachorro mestizo negro','Cachorro negro con patitas blancas, sin collar. Lo tengo en casa temporalmente.', current_date - 1, 'Miraflores','https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800','Llamar 76543210', false),
('perdido','mascotas','otra_mascota','Loro verde "Pepe"','Loro verde que habla, escapó por la ventana. Dice "hola Pepe".', current_date - 6, 'Calacoto','https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800','WhatsApp 79998877', false),
('encontrado','objetos','otro_objeto','Mochila negra con libros','Mochila negra con cuadernos de ingeniería, dejada en un minibús.', current_date - 7, 'Línea 273','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', null, true),
('perdido','mascotas','gato','Luna, gata blanca','Gata blanca de ojos azules, esterilizada, muy tímida.', current_date - 8, 'Obrajes','https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800','Llamar 72223344', true),
('encontrado','objetos','electronicos','Celular con funda rosada','Celular encontrado en banca del parque, funda rosada con brillos.', current_date, 'Parque Urbano Central','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800','Escribir a 73334455', false);