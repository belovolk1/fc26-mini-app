-- Система банов: админ банит пользователя на срок (минуты/часы/дни) или навсегда. Игрок получает уведомление и плашку в профиле.
-- Выполни после supabase-rating-anti-cheat.sql (нужна таблица player_warnings для уведомления).

-- 1) Таблица банов
create table if not exists public.user_bans (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  banned_by uuid not null references public.players(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

comment on column public.user_bans.expires_at is 'NULL = бессрочный бан';
comment on column public.user_bans.revoked_at is 'не NULL = бан снят досрочно';

-- Предикат только по revoked_at (now() в предикате недопустим — не immutable)
create index if not exists user_bans_player_active on public.user_bans (player_id) where revoked_at is null;

alter table public.user_bans enable row level security;
create policy "user_bans anon select" on public.user_bans for select to anon using (true);
create policy "user_bans anon insert" on public.user_bans for insert to anon with check (true);
create policy "user_bans anon update" on public.user_bans for update to anon using (true) with check (true);

-- 2) Активный бан игрока (для профиля и проверок)
create or replace function public.get_my_ban(p_player_id uuid)
returns table (id uuid, reason text, expires_at timestamptz, created_at timestamptz)
language sql security definer stable as $$
  select b.id, b.reason, b.expires_at, b.created_at
  from public.user_bans b
  where b.player_id = p_player_id and b.revoked_at is null
    and (b.expires_at is null or b.expires_at > now())
  order by b.created_at desc
  limit 1;
$$;

-- 3) Создать бан и отправить уведомление в player_warnings
-- p_duration_type: 'minutes' | 'hours' | 'days' | 'forever'
-- p_duration_value: число (для minutes/hours/days); для 'forever' не используется
create or replace function public.create_ban(
  p_player_id uuid,
  p_banned_by uuid,
  p_duration_type text,
  p_duration_value int,
  p_reason text default null
)
returns uuid
language plpgsql security definer
as $$
declare
  v_ban_id uuid;
  v_expires_at timestamptz;
  v_msg text;
  v_expires_str text;
begin
  if p_duration_type = 'forever' or p_duration_value is null or p_duration_value <= 0 then
    v_expires_at := null;
    v_expires_str := 'навсегда';
  elsif p_duration_type = 'minutes' then
    v_expires_at := now() + (p_duration_value || ' minutes')::interval;
    v_expires_str := to_char(v_expires_at, 'DD.MM.YYYY HH24:MI');
  elsif p_duration_type = 'hours' then
    v_expires_at := now() + (p_duration_value || ' hours')::interval;
    v_expires_str := to_char(v_expires_at, 'DD.MM.YYYY HH24:MI');
  elsif p_duration_type = 'days' then
    v_expires_at := now() + (p_duration_value || ' days')::interval;
    v_expires_str := to_char(v_expires_at, 'DD.MM.YYYY HH24:MI');
  else
    v_expires_at := now() + '1 hour'::interval;
    v_expires_str := to_char(v_expires_at, 'DD.MM.YYYY HH24:MI');
  end if;

  insert into public.user_bans (player_id, banned_by, reason, expires_at)
  values (p_player_id, p_banned_by, nullif(trim(p_reason), ''), v_expires_at)
  returning id into v_ban_id;

  v_msg := 'Вы заблокированы до ' || v_expires_str || '.';
  if nullif(trim(p_reason), '') is not null then
    v_msg := v_msg || ' Причина: ' || trim(p_reason);
  end if;

  insert into public.player_warnings (player_id, message)
  values (p_player_id, v_msg);

  return v_ban_id;
end;
$$;

-- 4) Список банов для админки (активные и недавно истёкшие)
create or replace function public.get_bans_admin()
returns table (
  id uuid,
  player_id uuid,
  player_name text,
  player_username text,
  banned_by_name text,
  reason text,
  created_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  is_active boolean
)
language sql security definer stable as $$
  select b.id, b.player_id,
    coalesce(nullif(trim(p.display_name), ''), p.username, '—')::text,
    p.username,
    coalesce(nullif(trim(adm.display_name), ''), adm.username, '—')::text,
    b.reason, b.created_at, b.expires_at, b.revoked_at,
    (b.revoked_at is null and (b.expires_at is null or b.expires_at > now()))
  from public.user_bans b
  join public.players p on p.id = b.player_id
  left join public.players adm on adm.id = b.banned_by
  order by b.created_at desc
  limit 300;
$$;

-- 5) Снять бан досрочно
create or replace function public.revoke_ban(p_ban_id uuid)
returns void
language plpgsql security definer as $$
begin
  update public.user_bans set revoked_at = now() where id = p_ban_id and revoked_at is null;
end;
$$;

-- 6) Список игроков для выбора в админке (поиск по username/display_name)
create or replace function public.get_players_for_admin(p_search text default null)
returns table (id uuid, display_name text, username text)
language sql security definer stable as $$
  select p.id,
    coalesce(nullif(trim(p.display_name), ''), p.username, '—')::text,
    p.username
  from public.players p
  where p_search is null or p_search = ''
     or p.username ilike '%' || p_search || '%'
     or p.display_name ilike '%' || p_search || '%'
     or (p.first_name || ' ' || p.last_name) ilike '%' || p_search || '%'
  order by p.display_name nulls last, p.username nulls last
  limit 100;
$$;

grant execute on function public.get_my_ban(uuid) to anon;
grant execute on function public.create_ban(uuid, uuid, text, int, text) to anon;
grant execute on function public.get_bans_admin() to anon;
grant execute on function public.revoke_ban(uuid) to anon;
grant execute on function public.get_players_for_admin(text) to anon;
