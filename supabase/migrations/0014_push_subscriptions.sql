-- 0014: push — suscripciones Web Push por usuario.
-- Guarda el PushSubscription (endpoint + claves) de cada dispositivo.
-- Solo service_role (edge functions) toca esta tabla; anon/authenticated: nada.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_push_subscriptions_user on public.push_subscriptions (user_id);

grant select, insert, update, delete on public.push_subscriptions to service_role;

-- Sin policies => RLS niega todo (service_role la saltea por bypass).
alter table public.push_subscriptions enable row level security;