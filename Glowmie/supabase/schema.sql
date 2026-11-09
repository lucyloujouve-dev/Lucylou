-- GLOWMIE — schéma PostgreSQL cible (Supabase)
-- Reprend les entités du prototype (js/store.js) et le §8 du cahier des charges.
-- À exécuter dans Supabase › SQL Editor.

create extension if not exists "pgcrypto";

-- ---------- utilisateurs & clients ----------
create table public.profiles (               -- 1 ligne par compte Supabase Auth
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete set null,   -- null = invitée / prospect
  email text not null unique,
  first_name text, last_name text, phone text, city text,
  points integer not null default 0,
  notes text,                                -- notes internes (admin uniquement, cf. vue ci-dessous)
  deleted_at timestamptz,                    -- anonymisation RGPD
  created_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers on delete cascade,
  label text, line text not null, zip text not null, city text not null
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers on delete cascade,
  kind text not null check (kind in ('newsletter', 'quiz')),
  granted boolean not null,
  source text,                               -- 'checkout', 'quiz', 'account'…
  created_at timestamptz not null default now()   -- historique : la ligne la plus récente fait foi
);

-- ---------- catalogue ----------
create table public.categories (id text primary key, label text not null);

create table public.products (
  id text primary key,                       -- slug
  name text not null, tagline text, description text, tips text,
  category_id text references public.categories,
  ingredients text[] not null default '{}',
  needs text[] not null default '{}',
  compare_at numeric(10,2),
  is_new boolean not null default false, featured boolean not null default false, active boolean not null default true,
  image_paths text[] not null default '{}',  -- Supabase Storage
  model_path text,                           -- modèle 3D (.glb) optionnel
  created_at timestamptz not null default now()
);

create table public.variants (
  id text primary key,
  product_id text not null references public.products on delete cascade,
  label text not null, price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0)
);

create table public.promo_codes (
  code text primary key, kind text not null check (kind in ('percent', 'shipping')),
  value numeric(5,2) not null default 0, active boolean not null default true, label text
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products on delete cascade,
  customer_id uuid references public.customers on delete set null,
  author text not null, rating smallint not null check (rating between 1 and 5), body text not null,
  status text not null default 'en_attente' check (status in ('en_attente', 'publie', 'refuse')),
  created_at timestamptz not null default now()
);

create table public.favorites (
  customer_id uuid references public.customers on delete cascade,
  product_id text references public.products on delete cascade,
  primary key (customer_id, product_id)
);

-- ---------- commandes & paiements ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  customer_id uuid not null references public.customers,
  status text not null default 'payee' check (status in ('payee', 'en_preparation', 'expediee', 'livree', 'annulee', 'remboursee')),
  subtotal numeric(10,2) not null, discount numeric(10,2) not null default 0, shipping numeric(10,2) not null default 0, total numeric(10,2) not null,
  promo_code text references public.promo_codes,
  shipping_address jsonb not null, carrier text, tracking text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  variant_id text not null references public.variants,
  name text not null, variant_label text, qty integer not null check (qty > 0), unit_price numeric(10,2) not null
);

create table public.payments (                -- alimentée par le webhook Stripe (mode test)
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  provider text not null default 'stripe_test',
  stripe_payment_intent text unique, status text not null, amount numeric(10,2) not null, last4 text,
  created_at timestamptz not null default now()
);

-- ---------- quiz, segments, fidélité, événements ----------
create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers on delete cascade,   -- null = résultat anonyme
  answers jsonb not null, product_ids text[] not null,
  created_at timestamptz not null default now()
);

create table public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers on delete cascade,
  delta integer not null, reason text not null, order_id uuid references public.orders,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers on delete cascade,
  type text not null, data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.automations (
  id text primary key, name text not null, trigger text not null,
  delay_days integer not null default 0, active boolean not null default true, subject text, description text
);

create table public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  automation_id text not null references public.automations,
  customer_id uuid references public.customers on delete cascade,
  order_id uuid references public.orders,
  status text not null check (status in ('planifie', 'envoye', 'ignore', 'annule')),
  scheduled_at timestamptz not null, sent_at timestamptz, reason text,
  opened boolean default false, clicked boolean default false, converted boolean default false,
  resend_id text
);

-- Segments calculés (même règles que GlowDB.segmentOf dans le prototype)
create or replace view public.customer_segments as
select c.id as customer_id,
  case
    when count(o.id) = 0 then 'prospect'
    when max(o.created_at) < now() - interval '90 days' then 'inactif'
    when count(o.id) >= 4 or sum(o.total) >= 150 then 'vip'
    when count(o.id) >= 2 then 'fidele'
    else 'primo'
  end as segment,
  count(o.id) as orders_count, coalesce(sum(o.total), 0) as total_spent, max(o.created_at) as last_order_at
from public.customers c
left join public.orders o on o.customer_id = c.id and o.status not in ('annulee', 'remboursee')
where c.deleted_at is null
group by c.id;

-- ---------- sécurité : Row Level Security ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.my_customer_id() returns uuid
language sql stable security definer set search_path = public as
$$ select id from public.customers where user_id = auth.uid() $$;

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.consents enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.variants enable row level security;
alter table public.promo_codes enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.quiz_results enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.events enable row level security;
alter table public.automations enable row level security;
alter table public.automation_logs enable row level security;

-- Admin : accès complet à tout
do $$ declare t text; begin
  foreach t in array array['profiles','customers','addresses','consents','categories','products','variants','promo_codes','reviews','favorites','orders','order_items','payments','quiz_results','loyalty_ledger','events','automations','automation_logs'] loop
    execute format('create policy "admin_all_%1$s" on public.%1$I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Catalogue public en lecture
create policy "public_read_categories" on public.categories for select using (true);
create policy "public_read_products" on public.products for select using (active);
create policy "public_read_variants" on public.variants for select using (exists (select 1 from public.products p where p.id = product_id and p.active));
create policy "public_read_reviews" on public.reviews for select using (status = 'publie');
create policy "customer_insert_review" on public.reviews for insert with check (status = 'en_attente');

-- Une cliente ne voit et ne modifie QUE ses propres données
create policy "own_profile" on public.profiles for select using (id = auth.uid());
create policy "own_customer_read" on public.customers for select using (user_id = auth.uid());
create policy "own_addresses" on public.addresses for all using (customer_id = public.my_customer_id()) with check (customer_id = public.my_customer_id());
create policy "own_consents_read" on public.consents for select using (customer_id = public.my_customer_id());
create policy "own_consents_insert" on public.consents for insert with check (customer_id = public.my_customer_id());
create policy "own_favorites" on public.favorites for all using (customer_id = public.my_customer_id()) with check (customer_id = public.my_customer_id());
create policy "own_orders" on public.orders for select using (customer_id = public.my_customer_id());
create policy "own_order_items" on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = public.my_customer_id()));
create policy "own_quiz" on public.quiz_results for select using (customer_id = public.my_customer_id());
create policy "own_loyalty" on public.loyalty_ledger for select using (customer_id = public.my_customer_id());
-- Les clientes ne modifient pas directement customers.points / notes : la mise à jour du profil
-- passe par une Server Action Next.js qui n'écrit que first_name, last_name, phone.
-- Commandes, paiements, événements et journaux d'automatisation sont écrits côté serveur
-- (service_role : webhook Stripe, route API checkout, cron Vercel) et ne sont jamais insérables par le client.
