-- Система жалоб на матчи (ладдер и турнир). Жалоба → матч не засчитывается → админ решает: засчитать или обнулить → уведомления игрокам и админу в Telegram.
-- Выполни после supabase-rpc-matches.sql, supabase-rating-anti-cheat.sql (если есть) и supabase-tournaments.sql.
-- В Supabase Storage создай бакет "reports" (public для чтения скриншотов).

-- 1) Результат матча может быть CANCELLED (обнулён по жалобе)
comment on column public.matches.result is 'A_WIN | B_WIN | DRAW | PENDING | CANCELLED (по решению админа по жалобе)';

-- 2) Таблица жалоб
create table if not exists public.match_reports (
  id uuid primary key default gen_random_uuid(),
  match_type text not null check (match_type in ('ladder', 'tournament')),
  match_id text not null,
  reporter_player_id uuid not null references public.players(id) on delete cascade,
  message text not null,
  screenshot_url text,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  admin_comment text,
  resolution text check (resolution in ('counted', 'voided')),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists match_reports_status on public.match_reports(status);
create index if not exists match_reports_created on public.match_reports(created_at desc);
-- Одна жалоба на один матч от одного пользователя
create unique index if not exists match_reports_one_per_match_reporter on public.match_reports (match_type, match_id, reporter_player_id);

-- 3) Уведомления игрокам о решении по жалобе
create table if not exists public.report_resolution_notifications (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.match_reports(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists report_resolution_notifications_player on public.report_resolution_notifications(player_id, read_at);

-- 4) Очередь уведомления админу в Telegram (бот опрашивает)
create table if not exists public.report_telegram_notifications (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.match_reports(id) on delete cascade,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.match_reports enable row level security;
alter table public.report_resolution_notifications enable row level security;
-- Политики для anon (гость) и authenticated (логин по JWT/Telegram) — иначе «new row violates row-level security policy»
create policy "match_reports select" on public.match_reports for select to anon using (true);
create policy "match_reports insert" on public.match_reports for insert to anon with check (true);
create policy "match_reports update" on public.match_reports for update to anon using (true) with check (true);
drop policy if exists "match_reports select auth" on public.match_reports;
drop policy if exists "match_reports insert auth" on public.match_reports;
drop policy if exists "match_reports update auth" on public.match_reports;
create policy "match_reports select auth" on public.match_reports for select to authenticated using (true);
create policy "match_reports insert auth" on public.match_reports for insert to authenticated with check (true);
create policy "match_reports update auth" on public.match_reports for update to authenticated using (true) with check (true);
create policy "report_resolution_notifications select" on public.report_resolution_notifications for select to anon using (true);
create policy "report_resolution_notifications insert" on public.report_resolution_notifications for insert to anon with check (true);
create policy "report_resolution_notifications update" on public.report_resolution_notifications for update to anon using (true) with check (true);
drop policy if exists "report_resolution_notifications select auth" on public.report_resolution_notifications;
drop policy if exists "report_resolution_notifications insert auth" on public.report_resolution_notifications;
drop policy if exists "report_resolution_notifications update auth" on public.report_resolution_notifications;
create policy "report_resolution_notifications select auth" on public.report_resolution_notifications for select to authenticated using (true);
create policy "report_resolution_notifications insert auth" on public.report_resolution_notifications for insert to authenticated with check (true);
create policy "report_resolution_notifications update auth" on public.report_resolution_notifications for update to authenticated using (true) with check (true);
-- report_telegram_notifications: RLS + политики, чтобы create_match_report не падал при вставке (если RLS включён в проекте)
alter table public.report_telegram_notifications enable row level security;
drop policy if exists "report_telegram_notifications insert anon" on public.report_telegram_notifications;
drop policy if exists "report_telegram_notifications insert auth" on public.report_telegram_notifications;
drop policy if exists "report_telegram_notifications select service" on public.report_telegram_notifications;
create policy "report_telegram_notifications insert anon" on public.report_telegram_notifications for insert to anon with check (true);
create policy "report_telegram_notifications insert auth" on public.report_telegram_notifications for insert to authenticated with check (true);
create policy "report_telegram_notifications select service" on public.report_telegram_notifications for select to service_role using (true);

-- 5) Подтверждение матча ладдера от имени админа (при решении «засчитать» по жалобе)
create or replace function public.admin_confirm_match_result(p_match_id text)
returns text
language plpgsql
security definer
as $$
declare
  v_match record;
  v_score_a int; v_score_b int; v_result text; v_updated int;
  v_elo_a int; v_elo_b int; v_matches_a bigint; v_matches_b bigint; v_k_a int; v_k_b int;
  v_expected_a numeric; v_score_actual_a numeric; v_score_actual_b numeric;
  v_new_elo_a int; v_new_elo_b int; v_default_elo int := 1200; v_delta_a int; v_delta_b int;
begin
  select id, player_a_id, player_b_id, score_a, score_b into v_match
  from public.matches
  where id::text = p_match_id and result = 'PENDING' and score_submitted_by is not null;
  if not found then return 'Match not found or not pending'; end if;
  v_score_a := v_match.score_a; v_score_b := v_match.score_b;
  if v_score_a > v_score_b then v_result := 'A_WIN'; elsif v_score_b > v_score_a then v_result := 'B_WIN'; else v_result := 'DRAW'; end if;

  select coalesce(elo, v_default_elo) into v_elo_a from public.players where id = v_match.player_a_id;
  select coalesce(elo, v_default_elo) into v_elo_b from public.players where id = v_match.player_b_id;
  v_elo_a := greatest(coalesce(v_elo_a, v_default_elo), 0); v_elo_b := greatest(coalesce(v_elo_b, v_default_elo), 0);

  select count(*)::bigint into v_matches_a from public.matches
  where (player_a_id = v_match.player_a_id or player_b_id = v_match.player_a_id) and result is distinct from 'PENDING' and result <> 'CANCELLED' and coalesce(count_for_rating, true) = true;
  select count(*)::bigint into v_matches_b from public.matches
  where (player_a_id = v_match.player_b_id or player_b_id = v_match.player_b_id) and result is distinct from 'PENDING' and result <> 'CANCELLED' and coalesce(count_for_rating, true) = true;
  v_k_a := case when v_matches_a <= 10 then 80 when v_matches_a <= 30 then 60 when v_matches_a <= 100 then 40 else 30 end;
  v_k_b := case when v_matches_b <= 10 then 80 when v_matches_b <= 30 then 60 when v_matches_b <= 100 then 40 else 30 end;

  v_expected_a := 1.0 / (1.0 + power(10, (v_elo_b - v_elo_a) / 400.0));
  if v_result = 'A_WIN' then v_score_actual_a := 1; v_score_actual_b := 0; elsif v_result = 'B_WIN' then v_score_actual_a := 0; v_score_actual_b := 1; else v_score_actual_a := 0.5; v_score_actual_b := 0.5; end if;

  v_new_elo_a := greatest(round(v_elo_a + v_k_a * (v_score_actual_a - v_expected_a))::int, 0);
  v_new_elo_b := greatest(round(v_elo_b + v_k_b * (v_score_actual_b - (1.0 - v_expected_a)))::int, 0);
  v_delta_a := v_new_elo_a - v_elo_a; v_delta_b := v_new_elo_b - v_elo_b;

  update public.matches set result = v_result, played_at = coalesce(played_at, now()), elo_delta_a = v_delta_a, elo_delta_b = v_delta_b where id::text = p_match_id and result = 'PENDING';
  get diagnostics v_updated = row_count; if v_updated = 0 then return 'Could not update match'; end if;
  update public.players set elo = v_new_elo_a where id = v_match.player_a_id;
  update public.players set elo = v_new_elo_b where id = v_match.player_b_id;
  return null;
exception when others then return SQLERRM;
end;
$$;

-- 6) Создать жалобу. SECURITY INVOKER — вставка от вызывающего (anon/authenticated), RLS политики разрешают.
create or replace function public.create_match_report(
  p_match_type text,
  p_match_id text,
  p_reporter_player_id uuid,
  p_message text,
  p_screenshot_url text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_report_id uuid;
begin
  if p_match_type not in ('ladder', 'tournament') or nullif(trim(p_message), '') is null then
    return null;
  end if;
  if exists (select 1 from public.match_reports where match_type = p_match_type and match_id = p_match_id and reporter_player_id = p_reporter_player_id) then
    return null;
  end if;
  insert into public.match_reports (match_type, match_id, reporter_player_id, message, screenshot_url)
  values (p_match_type, p_match_id, p_reporter_player_id, trim(p_message), nullif(trim(p_screenshot_url), ''))
  returning id into v_report_id;
  insert into public.report_telegram_notifications (report_id) values (v_report_id);
  return v_report_id;
end;
$$;

-- 7) Решить жалобу: засчитать матч или обнулить, отправить уведомления обоим игрокам
create or replace function public.resolve_match_report(
  p_report_id uuid,
  p_admin_comment text,
  p_resolution text
)
returns text
language plpgsql
security definer
as $$
declare
  v_report record;
  v_msg text;
  v_err text;
  v_player_a uuid;
  v_player_b uuid;
begin
  if p_resolution not in ('counted', 'voided') then return 'Invalid resolution'; end if;
  select * into v_report from public.match_reports where id = p_report_id and status = 'pending';
  if not found then return 'Report not found or already resolved'; end if;

  if v_report.match_type = 'ladder' then
    select player_a_id, player_b_id into v_player_a, v_player_b from public.matches where id::text = v_report.match_id;
    if p_resolution = 'counted' then
      v_err := public.admin_confirm_match_result(v_report.match_id);
      if v_err is not null then return v_err; end if;
      v_msg := 'По вашей жалобе администратор принял решение: матч засчитан.' || case when nullif(trim(p_admin_comment), '') is not null then E'\n\nКомментарий: ' || trim(p_admin_comment) else '' end;
    else
      update public.matches set result = 'CANCELLED', played_at = coalesce(played_at, now()) where id::text = v_report.match_id;
      v_msg := 'По вашей жалобе администратор принял решение: матч обнулён (не засчитан).' || case when nullif(trim(p_admin_comment), '') is not null then E'\n\nКомментарий: ' || trim(p_admin_comment) else '' end;
    end if;
  else
    select player_a_id, player_b_id into v_player_a, v_player_b from public.tournament_matches where id::text = v_report.match_id;
    if p_resolution = 'counted' then
      update public.tournament_matches set winner_id = case when (select score_a from public.tournament_matches where id::text = v_report.match_id) > (select score_b from public.tournament_matches where id::text = v_report.match_id) then v_player_a when (select score_b from public.tournament_matches where id::text = v_report.match_id) > (select score_a from public.tournament_matches where id::text = v_report.match_id) then v_player_b else null end, status = 'confirmed' where id::text = v_report.match_id;
      v_msg := 'По вашей жалобе администратор принял решение: матч засчитан.' || case when nullif(trim(p_admin_comment), '') is not null then E'\n\nКомментарий: ' || trim(p_admin_comment) else '' end;
    else
      update public.tournament_matches set winner_id = null, status = 'finished' where id::text = v_report.match_id;
      v_msg := 'По вашей жалобе администратор принял решение: матч обнулён (ничья не засчитана).' || case when nullif(trim(p_admin_comment), '') is not null then E'\n\nКомментарий: ' || trim(p_admin_comment) else '' end;
    end if;
  end if;

  update public.match_reports set status = 'resolved', admin_comment = nullif(trim(p_admin_comment), ''), resolution = p_resolution, resolved_at = now() where id = p_report_id;

  if v_player_a is not null then
    insert into public.report_resolution_notifications (report_id, player_id, message) values (p_report_id, v_player_a, v_msg);
  end if;
  if v_player_b is not null and v_player_b <> v_player_a then
    insert into public.report_resolution_notifications (report_id, player_id, message) values (p_report_id, v_player_b, v_msg);
  end if;
  return null;
exception when others then return SQLERRM;
end;
$$;

-- 8) Список жалоб для админки (с именами и данными матча)
create or replace function public.get_match_reports_admin()
returns table (
  id uuid,
  match_type text,
  match_id text,
  reporter_player_id uuid,
  reporter_name text,
  message text,
  screenshot_url text,
  status text,
  admin_comment text,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz,
  player_a_id uuid,
  player_b_id uuid,
  player_a_name text,
  player_b_name text,
  score_display text
)
language sql
security definer
stable
as $$
  select
    r.id, r.match_type, r.match_id, r.reporter_player_id,
    coalesce(nullif(trim(rep.display_name), ''), case when coalesce(rep.username, '') <> '' then '@' || rep.username else coalesce(rep.first_name, '') || ' ' || coalesce(rep.last_name, '') end, '—')::text,
    r.message, r.screenshot_url, r.status, r.admin_comment, r.resolution, r.resolved_at, r.created_at,
    case when r.match_type = 'ladder' then (select m.player_a_id from public.matches m where m.id::text = r.match_id) else (select m.player_a_id from public.tournament_matches m where m.id::text = r.match_id) end,
    case when r.match_type = 'ladder' then (select m.player_b_id from public.matches m where m.id::text = r.match_id) else (select m.player_b_id from public.tournament_matches m where m.id::text = r.match_id) end,
    case when r.match_type = 'ladder' then (select coalesce(nullif(trim(pa.display_name), ''), pa.username, '—') from public.matches m join public.players pa on pa.id = m.player_a_id where m.id::text = r.match_id) else (select coalesce(nullif(trim(pa.display_name), ''), pa.username, '—') from public.tournament_matches m join public.players pa on pa.id = m.player_a_id where m.id::text = r.match_id) end,
    case when r.match_type = 'ladder' then (select coalesce(nullif(trim(pb.display_name), ''), pb.username, '—') from public.matches m join public.players pb on pb.id = m.player_b_id where m.id::text = r.match_id) else (select coalesce(nullif(trim(pb.display_name), ''), pb.username, '—') from public.tournament_matches m join public.players pb on pb.id = m.player_b_id where m.id::text = r.match_id) end,
    case when r.match_type = 'ladder' then (select (m.score_a::text || ' : ' || m.score_b::text) from public.matches m where m.id::text = r.match_id) else (select (m.score_a::text || ' : ' || m.score_b::text) from public.tournament_matches m where m.id::text = r.match_id) end
  from public.match_reports r
  join public.players rep on rep.id = r.reporter_player_id
  order by r.created_at desc
  limit 200;
$$;

-- 9) Уведомления о решении по жалобе для игрока
create or replace function public.get_my_report_resolutions(p_player_id uuid)
returns table (id uuid, report_id uuid, message text, created_at timestamptz)
language sql security definer stable as $$
  select n.id, n.report_id, n.message, n.created_at from public.report_resolution_notifications n where n.player_id = p_player_id and n.read_at is null order by n.created_at desc;
$$;

create or replace function public.mark_report_resolution_read(p_notification_id uuid, p_player_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.report_resolution_notifications set read_at = now() where id = p_notification_id and player_id = p_player_id;
end;
$$;

-- 10) Исключить CANCELLED из подсчёта матчей (запускай ПОСЛЕ supabase-rating-anti-cheat.sql, чтобы колонка count_for_rating уже была)
drop function if exists public.get_my_matches_count(uuid);
create or replace function public.get_my_matches_count(p_player_id uuid)
returns bigint language sql security definer stable as $$
  select count(*)::bigint from public.matches
  where (player_a_id = p_player_id or player_b_id = p_player_id)
    and result is distinct from 'PENDING' and result is distinct from 'CANCELLED' and coalesce(count_for_rating, true) = true;
$$;

-- Storage: в Supabase Dashboard → Storage создай бакет "reports" (public). Политики:
-- create policy "reports anon insert" on storage.objects for insert to anon with check (bucket_id = 'reports');
-- create policy "reports public read" on storage.objects for select to public using (bucket_id = 'reports');

grant execute on function public.admin_confirm_match_result(text) to anon;
grant execute on function public.create_match_report(text, text, uuid, text, text) to anon;
grant execute on function public.create_match_report(text, text, uuid, text, text) to authenticated;
grant execute on function public.resolve_match_report(uuid, text, text) to anon;
grant execute on function public.get_match_reports_admin() to anon;
grant execute on function public.get_my_report_resolutions(uuid) to anon;
grant execute on function public.mark_report_resolution_read(uuid, uuid) to anon;
