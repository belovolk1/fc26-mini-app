-- RPC для запросов к matches по player_id (UUID в теле запроса — без 400 от PostgREST).
-- Выполни в Supabase → SQL Editor.

-- Колонка: кто ввёл счёт (второй игрок должен подтвердить)
alter table public.matches
  add column if not exists score_submitted_by uuid references public.players(id);

-- Колонка: когда матч подтверждён (для подтверждения результата)
alter table public.matches
  add column if not exists played_at timestamptz;

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
create or replace function public.confirm_match_result(p_match_id text, p_player_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_score_a int;
  v_score_b int;
  v_result text;
begin
  select score_a, score_b into v_score_a, v_score_b
  from public.matches
  where id::text = p_match_id and result = 'PENDING' and score_submitted_by is not null
    and (player_a_id = p_player_id or player_b_id = p_player_id);
  if not found then return; end if;
  if v_score_a > v_score_b then v_result := 'A_WIN';
  elsif v_score_b > v_score_a then v_result := 'B_WIN';
  else v_result := 'DRAW'; end if;
  update public.matches
  set result = v_result, played_at = now()
  where id::text = p_match_id and result = 'PENDING';
end;
$$;

-- Все сыгранные матчи (с именами игроков) для страницы «Все матчи»
create or replace function public.get_all_played_matches()
returns table (
  match_id bigint,
  player_a_name text,
  player_b_name text,
  score_a int,
  score_b int,
  result text,
  played_at timestamptz
)
language sql
security definer
stable
as $$
  select
    m.id,
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
    m.played_at
  from public.matches m
  join public.players pa on pa.id = m.player_a_id
  join public.players pb on pb.id = m.player_b_id
  where m.result is distinct from 'PENDING'
  order by m.played_at desc nulls last
  limit 200;
$$;

-- Рейтинг всех игроков (для страницы «Рейтинг»)
create or replace function public.get_leaderboard()
returns table (
  rank bigint,
  player_id uuid,
  display_name text,
  elo int,
  matches_count bigint
)
language sql
security definer
stable
as $$
  select
    row_number() over (order by p.elo desc nulls last, p.id)::bigint,
    p.id,
    coalesce(
      case when p.username is not null and p.username <> '' then '@' || p.username
        else nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '')
      end, '—'
    )::text,
    p.elo,
    (select count(*)::bigint from public.matches m
     where (m.player_a_id = p.id or m.player_b_id = p.id) and m.result is distinct from 'PENDING')
  from public.players p
  order by p.elo desc nulls last, p.id
  limit 500;
$$;

-- Разрешить anon вызывать RPC
grant execute on function public.get_my_pending_match(uuid) to anon;
grant execute on function public.get_my_matches_count(uuid) to anon;
grant execute on function public.submit_match_score(text, uuid, int, int) to anon, authenticated;
grant execute on function public.confirm_match_result(text, uuid) to anon;
grant execute on function public.get_all_played_matches() to anon;
grant execute on function public.get_leaderboard() to anon;
