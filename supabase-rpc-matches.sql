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

-- Разрешить anon вызывать RPC
grant execute on function public.get_my_pending_match(uuid) to anon;
grant execute on function public.get_my_matches_count(uuid) to anon;
