-- Защита от перелива рейтинга (30 дней): детекция подозрительных пар, обнуление учёта матчей, пересчёт ELO, предупреждения.
-- Выполни в Supabase → SQL Editor после supabase-rpc-matches.sql и supabase-matchmaking.sql.

-- 1) Признак «учитывать матч в рейтинге» (false = матч в истории остаётся, но не влияет на ELO)
alter table public.matches
  add column if not exists count_for_rating boolean not null default true;

comment on column public.matches.count_for_rating is 'false = матч аннулирован для рейтинга (перелив/читинг), в истории остаётся';

-- 2) Таблица нарушений (для админа и истории)
create table if not exists public.rating_violations (
  id uuid primary key default gen_random_uuid(),
  player_a_id uuid not null references public.players(id) on delete cascade,
  player_b_id uuid not null references public.players(id) on delete cascade,
  detected_at timestamptz not null default now(),
  matches_voided_count int not null default 0,
  message text,
  created_at timestamptz not null default now(),
  admin_seen_at timestamptz
);

comment on table public.rating_violations is 'Зафиксированные случаи перелива рейтинга между парой игроков';

-- 3) Предупреждения игрокам (модалка при входе)
create table if not exists public.player_warnings (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  rating_violation_id uuid references public.rating_violations(id) on delete set null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists player_warnings_player_read on public.player_warnings (player_id, read_at);

-- RLS (админ по логину в приложении; чтение — только свой player_id для player_warnings)
alter table public.rating_violations enable row level security;
alter table public.player_warnings enable row level security;

drop policy if exists "rating_violations anon select" on public.rating_violations;
drop policy if exists "rating_violations anon insert" on public.rating_violations;
drop policy if exists "rating_violations anon update" on public.rating_violations;
create policy "rating_violations anon select" on public.rating_violations for select to anon using (true);
create policy "rating_violations anon insert" on public.rating_violations for insert to anon with check (true);
create policy "rating_violations anon update" on public.rating_violations for update to anon using (true) with check (true);

drop policy if exists "player_warnings select own" on public.player_warnings;
drop policy if exists "player_warnings insert" on public.player_warnings;
drop policy if exists "player_warnings update own" on public.player_warnings;
create policy "player_warnings select own" on public.player_warnings for select to anon
  using (true);
create policy "player_warnings insert" on public.player_warnings for insert to anon with check (true);
create policy "player_warnings update own" on public.player_warnings for update to anon
  using (true) with check (true);

-- 4) Пересчёт ELO одного игрока по всем «учтённым» матчам (порядок по played_at, старт 1200, K как в confirm_match_result). Обновляем только этого игрока; ELO соперника читаем из таблицы.
create or replace function public.recalc_elo_for_player(p_player_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_match record;
  v_my_elo int := 1200;
  v_opp_elo int;
  v_my_id uuid;
  v_opp_id uuid;
  v_my_matches int;
  v_k int;
  v_expected numeric;
  v_result text;
  v_score_actual numeric;
  v_new_elo int;
begin
  select count(*)::int into v_my_matches from public.matches
  where (player_a_id = p_player_id or player_b_id = p_player_id)
    and result is distinct from 'PENDING' and coalesce(count_for_rating, true) = true and played_at is not null;
  if v_my_matches = 0 then
    update public.players set elo = 1200 where id = p_player_id;
    return;
  end if;

  for v_match in
    select m.id, m.player_a_id, m.player_b_id, m.result, m.played_at
    from public.matches m
    where (m.player_a_id = p_player_id or m.player_b_id = p_player_id)
      and m.result is distinct from 'PENDING'
      and coalesce(m.count_for_rating, true) = true
      and m.played_at is not null
    order by m.played_at asc
  loop
    if v_match.player_a_id = p_player_id then v_my_id := v_match.player_a_id; v_opp_id := v_match.player_b_id;
    else v_my_id := v_match.player_b_id; v_opp_id := v_match.player_a_id; end if;

    v_opp_elo := greatest(coalesce((select elo from public.players where id = v_opp_id), 1200), 0);

    select count(*)::int into v_my_matches from public.matches
    where (player_a_id = p_player_id or player_b_id = p_player_id)
      and result is distinct from 'PENDING' and coalesce(count_for_rating, true) = true
      and played_at <= v_match.played_at and played_at is not null;

    v_k := case when v_my_matches <= 10 then 80 when v_my_matches <= 30 then 60 when v_my_matches <= 100 then 40 else 30 end;

    if v_my_id = v_match.player_a_id then
      v_expected := 1.0 / (1.0 + power(10, (v_opp_elo - v_my_elo) / 400.0));
      if v_match.result = 'A_WIN' then v_score_actual := 1; elsif v_match.result = 'B_WIN' then v_score_actual := 0; else v_score_actual := 0.5; end if;
    else
      v_expected := 1.0 / (1.0 + power(10, (v_my_elo - v_opp_elo) / 400.0));
      v_expected := 1.0 - v_expected;
      if v_match.result = 'B_WIN' then v_score_actual := 1; elsif v_match.result = 'A_WIN' then v_score_actual := 0; else v_score_actual := 0.5; end if;
    end if;

    v_new_elo := round(v_my_elo + v_k * (v_score_actual - v_expected))::int;
    v_new_elo := greatest(v_new_elo, 0);
    v_my_elo := v_new_elo;
    update public.players set elo = v_new_elo where id = p_player_id;
  end loop;
end;
$$;

-- 5) Детекция и наказание: только ладдер за 30 дней, пары N>=10 и доля побед >=90%, защита «только они двое» (>80% матчей друг с другом — пропуск)
create or replace function public.detect_and_punish_rating_manipulation()
returns int
language plpgsql
security definer
as $$
declare
  v_pair record;
  v_voided int;
  v_msg text;
  v_violation_id uuid;
  v_count int := 0;
begin
  for v_pair in
    with ladder_30d as (
      select m.id, m.player_a_id, m.player_b_id, m.result, m.played_at,
             least(m.player_a_id, m.player_b_id) as p1,
             greatest(m.player_a_id, m.player_b_id) as p2
      from public.matches m
      where m.result is distinct from 'PENDING'
        and (m.is_tournament = false or m.is_tournament is null)
        and m.played_at >= now() - interval '30 days'
        and coalesce(m.count_for_rating, true) = true
    ),
    pair_stats as (
      select
        p1, p2,
        count(*)::int as n,
        count(*) filter (where (result = 'A_WIN' and player_a_id = p1) or (result = 'B_WIN' and player_b_id = p1)) as wins_p1,
        count(*) filter (where (result = 'A_WIN' and player_a_id = p2) or (result = 'B_WIN' and player_b_id = p2)) as wins_p2
      from ladder_30d
      group by p1, p2
      having count(*) >= 10
    ),
    with_winrate as (
      select *, greatest(wins_p1, wins_p2)::float / nullif(n, 0) as strong_winrate
      from pair_stats
      where greatest(wins_p1, wins_p2)::float / nullif(n, 0) >= 0.90
    ),
    total_a as (
      select p1 as pid, count(*) as c from ladder_30d group by p1
      union all
      select p2, count(*) from ladder_30d group by p2
    ),
    total_per_player as (
      select pid, sum(c) as total from total_a group by pid
    ),
    share as (
      select w.*,
             (select total from total_per_player t where t.pid = w.p1) as tot1,
             (select total from total_per_player t where t.pid = w.p2) as tot2
      from with_winrate w
    )
    select
      share.p1, share.p2, share.n,
      share.n::float / nullif(share.tot1, 0) as share1,
      share.n::float / nullif(share.tot2, 0) as share2
    from share
    where share.n::float / nullif(share.tot1, 0) <= 0.80 or share.n::float / nullif(share.tot2, 0) <= 0.80
  loop
    update public.matches
    set count_for_rating = false
    where result is distinct from 'PENDING'
      and (is_tournament = false or is_tournament is null)
      and played_at >= now() - interval '30 days'
      and (least(player_a_id, player_b_id) = v_pair.p1 and greatest(player_a_id, player_b_id) = v_pair.p2);
    get diagnostics v_voided = row_count;

    v_msg := 'По данным за последние 30 дней система зафиксировала перелив рейтинга между вами и другим игроком. Рейтинг пересчитан без учёта этих матчей. Пожалуйста, не злоупотребляйте правилами.';

    insert into public.rating_violations (player_a_id, player_b_id, matches_voided_count, message)
    values (v_pair.p1, v_pair.p2, v_voided, v_msg)
    returning id into v_violation_id;

    insert into public.player_warnings (player_id, rating_violation_id, message)
    values (v_pair.p1, v_violation_id, v_msg), (v_pair.p2, v_violation_id, v_msg);

    perform public.recalc_elo_for_player(v_pair.p1);
    perform public.recalc_elo_for_player(v_pair.p2);

    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- 6) Проверка одной пары (вызов после confirm_match_result для быстрой реакции)
create or replace function public.check_pair_rating_manipulation(p_player_a_id uuid, p_player_b_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_p1 uuid := least(p_player_a_id, p_player_b_id);
  v_p2 uuid := greatest(p_player_a_id, p_player_b_id);
  v_n int;
  v_wins_p1 int;
  v_wins_p2 int;
  v_strong_rate float;
  v_tot1 int;
  v_tot2 int;
  v_voided int;
  v_msg text;
  v_violation_id uuid;
begin
  select count(*)::int,
         count(*) filter (where (result = 'A_WIN' and player_a_id = v_p1) or (result = 'B_WIN' and player_b_id = v_p1)),
         count(*) filter (where (result = 'A_WIN' and player_a_id = v_p2) or (result = 'B_WIN' and player_b_id = v_p2))
  into v_n, v_wins_p1, v_wins_p2
  from public.matches
  where result is distinct from 'PENDING'
    and (is_tournament = false or is_tournament is null)
    and played_at >= now() - interval '30 days'
    and coalesce(count_for_rating, true) = true
    and least(player_a_id, player_b_id) = v_p1 and greatest(player_a_id, player_b_id) = v_p2;

  if v_n is null or v_n < 10 then return false; end if;
  v_strong_rate := greatest(v_wins_p1, v_wins_p2)::float / v_n;
  if v_strong_rate < 0.90 then return false; end if;

  select count(*)::int into v_tot1 from public.matches
  where (player_a_id = v_p1 or player_b_id = v_p1) and result is distinct from 'PENDING'
    and (is_tournament = false or is_tournament is null) and played_at >= now() - interval '30 days' and coalesce(count_for_rating, true) = true;
  select count(*)::int into v_tot2 from public.matches
  where (player_a_id = v_p2 or player_b_id = v_p2) and result is distinct from 'PENDING'
    and (is_tournament = false or is_tournament is null) and played_at >= now() - interval '30 days' and coalesce(count_for_rating, true) = true;

  if v_tot1 > 0 and (v_n::float / v_tot1) > 0.80 and v_tot2 > 0 and (v_n::float / v_tot2) > 0.80 then
    return false;
  end if;

  update public.matches set count_for_rating = false
  where result is distinct from 'PENDING' and (is_tournament = false or is_tournament is null)
    and played_at >= now() - interval '30 days'
    and least(player_a_id, player_b_id) = v_p1 and greatest(player_a_id, player_b_id) = v_p2;
  get diagnostics v_voided = row_count;

  v_msg := 'По данным за последние 30 дней система зафиксировала перелив рейтинга между вами и другим игроком. Рейтинг пересчитан без учёта этих матчей. Пожалуйста, не злоупотребляйте правилами.';
  insert into public.rating_violations (player_a_id, player_b_id, matches_voided_count, message)
  values (v_p1, v_p2, v_voided, v_msg)
  returning id into v_violation_id;
  insert into public.player_warnings (player_id, rating_violation_id, message)
  values (v_p1, v_violation_id, v_msg), (v_p2, v_violation_id, v_msg);

  perform public.recalc_elo_for_player(v_p1);
  perform public.recalc_elo_for_player(v_p2);
  return true;
end;
$$;

grant execute on function public.recalc_elo_for_player(uuid) to anon;
grant execute on function public.detect_and_punish_rating_manipulation() to anon;
grant execute on function public.check_pair_rating_manipulation(uuid, uuid) to anon;

-- 7) Учёт только count_for_rating в подсчётах и в confirm_match_result (K-фактор + проверка пары после подтверждения)
-- get_my_matches_count: только матчи, учитываемые в рейтинге
drop function if exists public.get_my_matches_count(uuid);
create or replace function public.get_my_matches_count(p_player_id uuid)
returns bigint language sql security definer stable as $$
  select count(*)::bigint from public.matches
  where (player_a_id = p_player_id or player_b_id = p_player_id)
    and result is distinct from 'PENDING' and coalesce(count_for_rating, true) = true;
$$;
grant execute on function public.get_my_matches_count(uuid) to anon;

-- get_leaderboard: статы (матчи, победы и т.д.) только по count_for_rating
drop function if exists public.get_leaderboard();
create or replace function public.get_leaderboard()
returns table (rank bigint, player_id uuid, display_name text, avatar_url text, country_code text, elo int, matches_count bigint, wins bigint, draws bigint, losses bigint, goals_for bigint, goals_against bigint, win_rate numeric)
language sql security definer stable as $$
  with player_stats as (
    select p.id, p.elo, p.avatar_url, p.country_code,
      coalesce(nullif(trim(p.display_name), ''), case when p.username is not null and p.username <> '' then '@' || p.username else nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '') end, '—')::text as display_name,
      (select count(*)::bigint from public.matches m where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING' and m.result is distinct from 'CANCELLED' and coalesce(m.count_for_rating, true) = true) as matches_count,
      (select count(*)::bigint from public.matches m where ((m.player_a_id = p.id and m.result = 'A_WIN') or (m.player_b_id = p.id and m.result = 'B_WIN')) and coalesce(m.count_for_rating, true) = true) as wins,
      (select count(*)::bigint from public.matches m where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result = 'DRAW' and coalesce(m.count_for_rating, true) = true) as draws,
      (select count(*)::bigint from public.matches m where ((m.player_a_id = p.id and m.result = 'B_WIN') or (m.player_b_id = p.id and m.result = 'A_WIN')) and coalesce(m.count_for_rating, true) = true) as losses,
      (select coalesce(sum(case when m.player_a_id = p.id then m.score_a else m.score_b end), 0)::bigint from public.matches m where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING' and m.result is distinct from 'CANCELLED' and coalesce(m.count_for_rating, true) = true) as goals_for,
      (select coalesce(sum(case when m.player_a_id = p.id then m.score_b else m.score_a end), 0)::bigint from public.matches m where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING' and m.result is distinct from 'CANCELLED' and coalesce(m.count_for_rating, true) = true) as goals_against
    from public.players p
  )
  select row_number() over (order by s.elo desc nulls last, s.id)::bigint, s.id, s.display_name, s.avatar_url, s.country_code, s.elo, s.matches_count, s.wins, s.draws, s.losses, s.goals_for, s.goals_against,
    round(case when s.matches_count > 0 then (s.wins * 100.0 / s.matches_count) else null end, 1)::numeric
  from player_stats s
  where s.matches_count >= 10
  order by s.elo desc nulls last, s.id limit 500;
$$;
grant execute on function public.get_leaderboard() to anon;

-- get_player_profile: статы только по count_for_rating
drop function if exists public.get_player_profile(uuid);
create or replace function public.get_player_profile(p_player_id uuid)
returns table (rank bigint, player_id uuid, display_name text, avatar_url text, country_code text, elo int, matches_count bigint, wins bigint, draws bigint, losses bigint, goals_for bigint, goals_against bigint, win_rate numeric)
language sql security definer stable as $$
  with player_stats as (
    select p.id, p.elo, p.avatar_url, p.country_code,
      coalesce(nullif(trim(p.display_name), ''), case when p.username is not null and p.username <> '' then '@' || p.username else nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '') end, '—')::text as display_name,
      (select count(*)::bigint from public.matches m where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING' and m.result is distinct from 'CANCELLED' and coalesce(m.count_for_rating, true) = true) as matches_count,
      (select count(*)::bigint from public.matches m where ((m.player_a_id = p.id and m.result = 'A_WIN') or (m.player_b_id = p.id and m.result = 'B_WIN')) and coalesce(m.count_for_rating, true) = true) as wins,
      (select count(*)::bigint from public.matches m where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result = 'DRAW' and coalesce(m.count_for_rating, true) = true) as draws,
      (select count(*)::bigint from public.matches m where ((m.player_a_id = p.id and m.result = 'B_WIN') or (m.player_b_id = p.id and m.result = 'A_WIN')) and coalesce(m.count_for_rating, true) = true) as losses,
      (select coalesce(sum(case when m.player_a_id = p.id then m.score_a else m.score_b end), 0)::bigint from public.matches m where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING' and m.result is distinct from 'CANCELLED' and coalesce(m.count_for_rating, true) = true) as goals_for,
      (select coalesce(sum(case when m.player_a_id = p.id then m.score_b else m.score_a end), 0)::bigint from public.matches m where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING' and m.result is distinct from 'CANCELLED' and coalesce(m.count_for_rating, true) = true) as goals_against
    from public.players p where p.id = p_player_id
  ),
  ranked as (select s.*, (select count(*)::bigint + 1 from public.players p2 where p2.elo > s.elo or (p2.elo = s.elo and p2.id < s.id)) as rk from player_stats s)
  select r.rk, r.id, r.display_name, r.avatar_url, r.country_code, r.elo, r.matches_count, r.wins, r.draws, r.losses, r.goals_for, r.goals_against,
    round(case when r.matches_count > 0 then (r.wins * 100.0 / r.matches_count) else null end, 1)::numeric
  from ranked r;
$$;
grant execute on function public.get_player_profile(uuid) to anon;

-- confirm_match_result: K считаем только по count_for_rating; после успеха — проверка пары на перелив
drop function if exists public.confirm_match_result(text, uuid);
create or replace function public.confirm_match_result(p_match_id text, p_player_id uuid)
returns text language plpgsql security definer as $$
declare
  v_match record;
  v_score_a int; v_score_b int; v_result text; v_updated int;
  v_elo_a int; v_elo_b int; v_matches_a bigint; v_matches_b bigint; v_k_a int; v_k_b int;
  v_expected_a numeric; v_expected_b numeric; v_score_actual_a numeric; v_score_actual_b numeric;
  v_new_elo_a int; v_new_elo_b int; v_default_elo int := 1200; v_delta_a int; v_delta_b int;
begin
  select id, player_a_id, player_b_id, score_a, score_b into v_match from public.matches
  where id::text = p_match_id and result = 'PENDING' and score_submitted_by is not null and (player_a_id = p_player_id or player_b_id = p_player_id);
  if not found then return 'Match not found or you are not the opponent who must confirm'; end if;
  v_score_a := v_match.score_a; v_score_b := v_match.score_b;
  if v_score_a > v_score_b then v_result := 'A_WIN'; elsif v_score_b > v_score_a then v_result := 'B_WIN'; else v_result := 'DRAW'; end if;

  select coalesce(elo, v_default_elo) into v_elo_a from public.players where id = v_match.player_a_id;
  select coalesce(elo, v_default_elo) into v_elo_b from public.players where id = v_match.player_b_id;
  v_elo_a := greatest(coalesce(v_elo_a, v_default_elo), 0); v_elo_b := greatest(coalesce(v_elo_b, v_default_elo), 0);

  select count(*)::bigint into v_matches_a from public.matches where (player_a_id = v_match.player_a_id or player_b_id = v_match.player_a_id) and result is distinct from 'PENDING' and coalesce(count_for_rating, true) = true;
  select count(*)::bigint into v_matches_b from public.matches where (player_a_id = v_match.player_b_id or player_b_id = v_match.player_b_id) and result is distinct from 'PENDING' and coalesce(count_for_rating, true) = true;
  v_k_a := case when v_matches_a <= 10 then 80 when v_matches_a <= 30 then 60 when v_matches_a <= 100 then 40 else 30 end;
  v_k_b := case when v_matches_b <= 10 then 80 when v_matches_b <= 30 then 60 when v_matches_b <= 100 then 40 else 30 end;

  v_expected_a := 1.0 / (1.0 + power(10, (v_elo_b - v_elo_a) / 400.0)); v_expected_b := 1.0 - v_expected_a;
  if v_result = 'A_WIN' then v_score_actual_a := 1; v_score_actual_b := 0; elsif v_result = 'B_WIN' then v_score_actual_a := 0; v_score_actual_b := 1; else v_score_actual_a := 0.5; v_score_actual_b := 0.5; end if;

  v_new_elo_a := greatest(round(v_elo_a + v_k_a * (v_score_actual_a - v_expected_a))::int, 0);
  v_new_elo_b := greatest(round(v_elo_b + v_k_b * (v_score_actual_b - v_expected_b))::int, 0);
  v_delta_a := v_new_elo_a - v_elo_a; v_delta_b := v_new_elo_b - v_elo_b;

  update public.matches set result = v_result, played_at = coalesce(played_at, now()), elo_delta_a = v_delta_a, elo_delta_b = v_delta_b where id::text = p_match_id and result = 'PENDING';
  get diagnostics v_updated = row_count; if v_updated = 0 then return 'Could not update match'; end if;

  update public.players set elo = v_new_elo_a where id = v_match.player_a_id;
  update public.players set elo = v_new_elo_b where id = v_match.player_b_id;

  perform public.check_pair_rating_manipulation(v_match.player_a_id, v_match.player_b_id);
  return null;
exception when others then return SQLERRM;
end;
$$;
grant execute on function public.confirm_match_result(text, uuid) to anon;

-- 8) RPC для фронта: непрочитанные предупреждения игрока, пометить прочитанным, список нарушений для админа
create or replace function public.get_my_warnings(p_player_id uuid)
returns table (id uuid, message text, created_at timestamptz)
language sql security definer stable as $$
  select w.id, w.message, w.created_at from public.player_warnings w where w.player_id = p_player_id and w.read_at is null order by w.created_at desc;
$$;

create or replace function public.mark_warning_read(p_warning_id uuid, p_player_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.player_warnings set read_at = now() where id = p_warning_id and player_id = p_player_id;
end;
$$;

create or replace function public.get_rating_violations_admin()
returns table (id uuid, player_a_id uuid, player_b_id uuid, player_a_name text, player_b_name text, detected_at timestamptz, matches_voided_count int, message text, created_at timestamptz, admin_seen_at timestamptz)
language sql security definer stable as $$
  select rv.id, rv.player_a_id, rv.player_b_id,
    coalesce(nullif(trim(pa.display_name), ''), case when coalesce(pa.username, '') <> '' then '@' || pa.username else coalesce(pa.first_name, '') || ' ' || coalesce(pa.last_name, '') end, '—')::text,
    coalesce(nullif(trim(pb.display_name), ''), case when coalesce(pb.username, '') <> '' then '@' || pb.username else coalesce(pb.first_name, '') || ' ' || coalesce(pb.last_name, '') end, '—')::text,
    rv.detected_at, rv.matches_voided_count, rv.message, rv.created_at, rv.admin_seen_at
  from public.rating_violations rv
  left join public.players pa on pa.id = rv.player_a_id
  left join public.players pb on pb.id = rv.player_b_id
  order by rv.created_at desc limit 200;
$$;

create or replace function public.mark_rating_violation_seen(p_violation_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.rating_violations set admin_seen_at = now() where id = p_violation_id;
end;
$$;

grant execute on function public.get_my_warnings(uuid) to anon;
grant execute on function public.mark_warning_read(uuid, uuid) to anon;
grant execute on function public.get_rating_violations_admin() to anon;
grant execute on function public.mark_rating_violation_seen(uuid) to anon;
