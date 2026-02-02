-- RPC для запросов к matches по player_id (UUID в теле запроса — без 400 от PostgREST).
-- Выполни в Supabase → SQL Editor.

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
-- p_match_id: text — подходит и для bigint id (например "7"), и для uuid.
create or replace function public.submit_match_score(
  p_match_id text,
  p_player_id uuid,
  p_score_a int,
  p_score_b int
)
returns void
language plpgsql
security definer
as $$
begin
  update public.matches
  set score_a = p_score_a, score_b = p_score_b, score_submitted_by = p_player_id
  where id::text = p_match_id and result = 'PENDING'
    and (player_a_id = p_player_id or player_b_id = p_player_id);
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

-- Разрешить anon вызывать RPC
grant execute on function public.get_my_pending_match(uuid) to anon;
grant execute on function public.get_my_matches_count(uuid) to anon;
grant execute on function public.submit_match_score(text, uuid, int, int) to anon;
grant execute on function public.confirm_match_result(text, uuid) to anon;
