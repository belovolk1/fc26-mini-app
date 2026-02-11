-- RPC для запросов к matches по player_id (UUID в теле запроса — без 400 от PostgREST).
-- Выполни в Supabase → SQL Editor.

-- Колонка: кто ввёл счёт (второй игрок должен подтвердить)
alter table public.matches
  add column if not exists score_submitted_by uuid references public.players(id);

-- Колонка: когда матч подтверждён (для подтверждения результата)
alter table public.matches
  add column if not exists played_at timestamptz;

-- Колонки для изменения ELO по матчу (дельта для каждого игрока)
alter table public.matches
  add column if not exists elo_delta_a int;
alter table public.matches
  add column if not exists elo_delta_b int;

-- Профиль игрока: аватар (URL), страна (код), никнейм (редактируемый; данные Telegram хранятся для админа)
alter table public.players
  add column if not exists avatar_url text;
alter table public.players
  add column if not exists country_code text;
alter table public.players
  add column if not exists display_name text;
-- ELO рейтинг (классическая формула с переменным K)
alter table public.players
  add column if not exists elo int default 1200;

-- Всем существующим игрокам без рейтинга выставляем стартовый ELO = 1200
update public.players
set elo = 1200
where elo is null;

-- Один PENDING-матч игрока (для лобби и опроса при поиске). UUID передаётся в теле запроса — нет 400.
create or replace function public.get_my_pending_match(p_player_id uuid)
returns setof public.matches
language sql
security definer
stable
as $$
  select m.*
  from public.matches m
  where m.result = 'PENDING'
    and (m.player_a_id = p_player_id or m.player_b_id = p_player_id)
  order by m.created_at desc
  limit 1;
$$;

-- Количество подтверждённых матчей игрока (не PENDING)
create or replace function public.get_my_matches_count(p_player_id uuid)
returns bigint
language sql
security definer
stable
as $$
  select count(*)::bigint
  from public.matches
  where result is distinct from 'PENDING'
    and (player_a_id = p_player_id or player_b_id = p_player_id);
$$;

-- Отправить счёт матча (игрок ввёл счёт, ждём подтверждения соперника).
-- Возвращает null при успехе, иначе текст ошибки.
-- Удаляем обе версии, чтобы осталась только одна (p_match_id text).
drop function if exists public.submit_match_score(bigint, uuid, integer, integer);
drop function if exists public.submit_match_score(text, uuid, integer, integer);
create or replace function public.submit_match_score(
  p_match_id text,
  p_player_id uuid,
  p_score_a int,
  p_score_b int
)
returns text
language plpgsql
security definer
as $$
declare
  v_updated int;
begin
  update public.matches
  set score_a = p_score_a, score_b = p_score_b, score_submitted_by = p_player_id
  where id::text = p_match_id and result = 'PENDING'
    and (player_a_id = p_player_id or player_b_id = p_player_id);
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return 'Match not found or you are not a player';
  end if;
  return null;
exception when others then
  return SQLERRM;
end;
$$;

-- Подтвердить результат матча (второй игрок согласен со счётом). p_match_id: text.
-- После подтверждения пересчитывает ELO обоих игроков по классической формуле с переменным K:
-- 0–10 матчей → K=80, 11–30 → K=60, 31–100 → K=40, 100+ → K=30.
-- Возвращает null при успехе, иначе текст ошибки.
drop function if exists public.confirm_match_result(bigint, uuid);
drop function if exists public.confirm_match_result(text, uuid);
create or replace function public.confirm_match_result(p_match_id text, p_player_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  v_match record;
  v_score_a int;
  v_score_b int;
  v_result text;
  v_updated int;
  v_elo_a int;
  v_elo_b int;
  v_matches_a bigint;
  v_matches_b bigint;
  v_k_a int;
  v_k_b int;
  v_expected_a numeric;
  v_expected_b numeric;
  v_score_actual_a numeric;
  v_score_actual_b numeric;
  v_new_elo_a int;
  v_new_elo_b int;
  v_default_elo int := 1200;
  v_delta_a int;
  v_delta_b int;
begin
  select id, player_a_id, player_b_id, score_a, score_b into v_match
  from public.matches
  where id::text = p_match_id and result = 'PENDING' and score_submitted_by is not null
    and (player_a_id = p_player_id or player_b_id = p_player_id);
  if not found then
    return 'Match not found or you are not the opponent who must confirm';
  end if;
  v_score_a := v_match.score_a;
  v_score_b := v_match.score_b;
  if v_score_a > v_score_b then v_result := 'A_WIN';
  elsif v_score_b > v_score_a then v_result := 'B_WIN';
  else v_result := 'DRAW'; end if;

  -- ELO: текущий рейтинг (или 1200 для новичков)
  select coalesce(elo, v_default_elo) into v_elo_a from public.players where id = v_match.player_a_id;
  select coalesce(elo, v_default_elo) into v_elo_b from public.players where id = v_match.player_b_id;
  v_elo_a := coalesce(v_elo_a, v_default_elo);
  v_elo_b := coalesce(v_elo_b, v_default_elo);

  -- Количество подтверждённых матчей (уже включая этот)
  select count(*)::bigint into v_matches_a from public.matches
  where (player_a_id = v_match.player_a_id or player_b_id = v_match.player_a_id) and result is distinct from 'PENDING';
  select count(*)::bigint into v_matches_b from public.matches
  where (player_a_id = v_match.player_b_id or player_b_id = v_match.player_b_id) and result is distinct from 'PENDING';

  -- K по числу матчей: 0–10 → 80, 11–30 → 60, 31–100 → 40, 100+ → 30
  v_k_a := case when v_matches_a <= 10 then 80 when v_matches_a <= 30 then 60 when v_matches_a <= 100 then 40 else 30 end;
  v_k_b := case when v_matches_b <= 10 then 80 when v_matches_b <= 30 then 60 when v_matches_b <= 100 then 40 else 30 end;

  -- Ожидаемый счёт (классическая формула): E_A = 1 / (1 + 10^((R_B - R_A)/400))
  v_expected_a := 1.0 / (1.0 + power(10, (v_elo_b - v_elo_a) / 400.0));
  v_expected_b := 1.0 - v_expected_a;

  -- Фактический счёт: победа 1, ничья 0.5, поражение 0
  if v_result = 'A_WIN' then
    v_score_actual_a := 1; v_score_actual_b := 0;
  elsif v_result = 'B_WIN' then
    v_score_actual_a := 0; v_score_actual_b := 1;
  else
    v_score_actual_a := 0.5; v_score_actual_b := 0.5;
  end if;

  v_new_elo_a := round(v_elo_a + v_k_a * (v_score_actual_a - v_expected_a))::int;
  v_new_elo_b := round(v_elo_b + v_k_b * (v_score_actual_b - v_expected_b))::int;

  -- Не опускаем ниже 0
  v_new_elo_a := greatest(v_new_elo_a, 0);
  v_new_elo_b := greatest(v_new_elo_b, 0);

  -- Дельта рейтинга по матчу
  v_delta_a := v_new_elo_a - v_elo_a;
  v_delta_b := v_new_elo_b - v_elo_b;

  -- Обновляем матч: итоговый результат, время и изменение ELO
  update public.matches
  set
    result = v_result,
    played_at = coalesce(played_at, now()),
    elo_delta_a = v_delta_a,
    elo_delta_b = v_delta_b
  where id::text = p_match_id and result = 'PENDING';
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return 'Could not update match';
  end if;

  update public.players set elo = v_new_elo_a where id = v_match.player_a_id;
  update public.players set elo = v_new_elo_b where id = v_match.player_b_id;

  return null;
exception when others then
  return SQLERRM;
end;
$$;

-- Все сыгранные матчи (с именами и id игроков) для страницы «Все матчи»
drop function if exists public.get_all_played_matches();
create or replace function public.get_all_played_matches()
returns table (
  match_id bigint,
  player_a_id uuid,
  player_b_id uuid,
  player_a_name text,
  player_b_name text,
  score_a int,
  score_b int,
  result text,
  played_at timestamptz,
  elo_delta_a int,
  elo_delta_b int
)
language sql
security definer
stable
as $$
  select
    m.id,
    m.player_a_id,
    m.player_b_id,
    coalesce(
      case when pa.username is not null and pa.username <> '' then '@' || pa.username
        else nullif(trim(coalesce(pa.first_name, '') || ' ' || coalesce(pa.last_name, '')), '')
      end, '—'
    )::text,
    coalesce(
      case when pb.username is not null and pb.username <> '' then '@' || pb.username
        else nullif(trim(coalesce(pb.first_name, '') || ' ' || coalesce(pb.last_name, '')), '')
      end, '—'
    )::text,
    m.score_a,
    m.score_b,
    m.result,
    m.played_at,
    m.elo_delta_a,
    m.elo_delta_b
  from public.matches m
  join public.players pa on pa.id = m.player_a_id
  join public.players pb on pb.id = m.player_b_id
  where m.result is distinct from 'PENDING'
  order by m.played_at desc nulls last
  limit 200;
$$;

-- Рейтинг всех игроков с детальной статистикой (голы, винрейт и т.д.)
-- Меняем тип возврата — сначала удаляем старую функцию
drop function if exists public.get_leaderboard();
create or replace function public.get_leaderboard()
returns table (
  rank bigint,
  player_id uuid,
  display_name text,
  avatar_url text,
  country_code text,
  elo int,
  matches_count bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  goals_for bigint,
  goals_against bigint,
  win_rate numeric
)
language sql
security definer
stable
as $$
  with player_stats as (
    select
      p.id,
      p.elo,
      p.avatar_url,
      p.country_code,
      coalesce(
        nullif(trim(p.display_name), ''),
        case when p.username is not null and p.username <> '' then '@' || p.username
          else nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '')
        end,
        '—'
      )::text as display_name,
      (select count(*)::bigint from public.matches m
       where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING') as matches_count,
      (select count(*)::bigint from public.matches m
       where ((m.player_a_id = p.id and m.result = 'A_WIN') or (m.player_b_id = p.id and m.result = 'B_WIN'))) as wins,
      (select count(*)::bigint from public.matches m
       where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result = 'DRAW') as draws,
      (select count(*)::bigint from public.matches m
       where ((m.player_a_id = p.id and m.result = 'B_WIN') or (m.player_b_id = p.id and m.result = 'A_WIN'))) as losses,
      (select coalesce(sum(case when m.player_a_id = p.id then m.score_a else m.score_b end), 0)::bigint from public.matches m
       where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING') as goals_for,
      (select coalesce(sum(case when m.player_a_id = p.id then m.score_b else m.score_a end), 0)::bigint from public.matches m
       where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING') as goals_against
    from public.players p
  )
  select
    row_number() over (order by s.elo desc nulls last, s.id)::bigint,
    s.id,
    s.display_name,
    s.avatar_url,
    s.country_code,
    s.elo,
    s.matches_count,
    s.wins,
    s.draws,
    s.losses,
    s.goals_for,
    s.goals_against,
    round(
      case when s.matches_count > 0 then (s.wins * 100.0 / s.matches_count) else null end
    , 1)::numeric as win_rate
  from player_stats s
  where s.matches_count >= 10
  order by s.elo desc nulls last, s.id
  limit 500;
$$;

-- Профиль одного игрока по ID
drop function if exists public.get_player_profile(uuid);
create or replace function public.get_player_profile(p_player_id uuid)
returns table (
  rank bigint,
  player_id uuid,
  display_name text,
  avatar_url text,
  country_code text,
  elo int,
  matches_count bigint,
  wins bigint,
  draws bigint,
  losses bigint,
  goals_for bigint,
  goals_against bigint,
  win_rate numeric
)
language sql
security definer
stable
as $$
  with player_stats as (
    select
      p.id,
      p.elo,
      p.avatar_url,
      p.country_code,
      coalesce(
        nullif(trim(p.display_name), ''),
        case when p.username is not null and p.username <> '' then '@' || p.username
          else nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '')
        end,
        '—'
      )::text as display_name,
      (select count(*)::bigint from public.matches m
       where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING') as matches_count,
      (select count(*)::bigint from public.matches m
       where ((m.player_a_id = p.id and m.result = 'A_WIN') or (m.player_b_id = p.id and m.result = 'B_WIN'))) as wins,
      (select count(*)::bigint from public.matches m
       where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result = 'DRAW') as draws,
      (select count(*)::bigint from public.matches m
       where ((m.player_a_id = p.id and m.result = 'B_WIN') or (m.player_b_id = p.id and m.result = 'A_WIN'))) as losses,
      (select coalesce(sum(case when m.player_a_id = p.id then m.score_a else m.score_b end), 0)::bigint from public.matches m
       where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING') as goals_for,
      (select coalesce(sum(case when m.player_a_id = p.id then m.score_b else m.score_a end), 0)::bigint from public.matches m
       where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING') as goals_against
    from public.players p
    where p.id = p_player_id
  ),
  ranked as (
    select
      s.*,
      (select count(*)::bigint + 1 from public.players p2 where p2.elo > s.elo or (p2.elo = s.elo and p2.id < s.id)) as rk
    from player_stats s
  )
  select
    r.rk,
    r.id as player_id,
    r.display_name,
    r.avatar_url,
    r.country_code,
    r.elo,
    r.matches_count,
    r.wins,
    r.draws,
    r.losses,
    r.goals_for,
    r.goals_against,
    round(case when r.matches_count > 0 then (r.wins * 100.0 / r.matches_count) else null end, 1)::numeric
  from ranked r;
$$;

-- Последние 10 матчей игрока: ладдер + сыгранные турнирные (для страницы профиля)
-- match_id — text (ладдер: id::text, турнир: uuid::text). match_type: 'ladder'|'tournament'. tournament_name — null для ладдера.
drop function if exists public.get_player_recent_matches(uuid);
create or replace function public.get_player_recent_matches(p_player_id uuid)
returns table (
  match_id text,
  match_type text,
  tournament_name text,
  opponent_id uuid,
  opponent_name text,
  my_score int,
  opp_score int,
  result text,
  played_at timestamptz,
  elo_delta int
)
language sql
security definer
stable
as $$
  (
    select
      m.id::text,
      'ladder'::text,
      null::text,
      (case when m.player_a_id = p_player_id then m.player_b_id else m.player_a_id end),
      coalesce(
        nullif(trim(
          case when m.player_a_id = p_player_id then coalesce(pb.display_name, case when pb.username is not null and pb.username <> '' then '@' || pb.username else nullif(trim(coalesce(pb.first_name, '') || ' ' || coalesce(pb.last_name, '')), '') end)
               else coalesce(pa.display_name, case when pa.username is not null and pa.username <> '' then '@' || pa.username else nullif(trim(coalesce(pa.first_name, '') || ' ' || coalesce(pa.last_name, '')), '') end)
          end
        ), ''),
        '—'
      )::text,
      (case when m.player_a_id = p_player_id then m.score_a else m.score_b end)::int,
      (case when m.player_a_id = p_player_id then m.score_b else m.score_a end)::int,
      (case
         when m.result = 'DRAW' then 'draw'
         when (m.result = 'A_WIN' and m.player_a_id = p_player_id) or (m.result = 'B_WIN' and m.player_b_id = p_player_id) then 'win'
         else 'loss'
       end)::text,
      m.played_at,
      (case when m.player_a_id = p_player_id then m.elo_delta_a else m.elo_delta_b end)::int
    from public.matches m
    join public.players pa on pa.id = m.player_a_id
    join public.players pb on pb.id = m.player_b_id
    where (m.player_a_id = p_player_id or m.player_b_id = p_player_id)
      and m.result is distinct from 'PENDING'
  )
  union all
  (
    select
      tm.id::text,
      'tournament'::text,
      t.name,
      (case when tm.player_a_id = p_player_id then tm.player_b_id else tm.player_a_id end),
      coalesce(
        nullif(trim(
          case when tm.player_a_id = p_player_id then coalesce(pb.display_name, case when pb.username is not null and pb.username <> '' then '@' || pb.username else nullif(trim(coalesce(pb.first_name, '') || ' ' || coalesce(pb.last_name, '')), '') end)
               else coalesce(pa.display_name, case when pa.username is not null and pa.username <> '' then '@' || pa.username else nullif(trim(coalesce(pa.first_name, '') || ' ' || coalesce(pa.last_name, '')), '') end)
          end
        ), ''),
        '—'
      )::text,
      (case when tm.player_a_id = p_player_id then tm.score_a else tm.score_b end)::int,
      (case when tm.player_a_id = p_player_id then tm.score_b else tm.score_a end)::int,
      (case
         when tm.winner_id is null then 'draw'
         when tm.winner_id = p_player_id then 'win'
         else 'loss'
       end)::text,
      tm.created_at,
      null::int
    from public.tournament_matches tm
    join public.tournaments t on t.id = tm.tournament_id
    left join public.players pa on pa.id = tm.player_a_id
    left join public.players pb on pb.id = tm.player_b_id
    where (tm.player_a_id = p_player_id or tm.player_b_id = p_player_id)
      and tm.status in ('confirmed', 'finished', 'auto_win_a', 'auto_win_b', 'auto_no_show')
      and tm.player_a_id is not null and tm.player_b_id is not null
  )
  order by played_at desc nulls last
  limit 10;
$$;

-- Разрешить anon вызывать RPC
grant execute on function public.get_my_pending_match(uuid) to anon;
grant execute on function public.get_my_matches_count(uuid) to anon;
grant execute on function public.submit_match_score(text, uuid, int, int) to anon, authenticated;
grant execute on function public.confirm_match_result(text, uuid) to anon;
grant execute on function public.get_all_played_matches() to anon;
grant execute on function public.get_leaderboard() to anon;
grant execute on function public.get_player_profile(uuid) to anon;
grant execute on function public.get_player_recent_matches(uuid) to anon;

-- Storage для аватаров: в Supabase Dashboard → Storage создай бакет "avatars", сделай его public.
-- В политиках бакета разреши anon: INSERT (upload) и SELECT (read) для всех путей или для avatars/*.
