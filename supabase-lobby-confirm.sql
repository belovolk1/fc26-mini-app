-- Подтверждение входа в лобби: матч создаётся при найденной паре, но лобби показывается только после того, как оба игрока нажали «Подтвердить».
-- Выполни после supabase-rpc-matches.sql и supabase-matchmaking.sql.

-- Колонки: оба игрока должны подтвердить матч, чтобы лобби стало активным
alter table public.matches
  add column if not exists player_a_accepted_at timestamptz;
alter table public.matches
  add column if not exists player_b_accepted_at timestamptz;

comment on column public.matches.player_a_accepted_at is 'Игрок A подтвердил вход в лобби';
comment on column public.matches.player_b_accepted_at is 'Игрок B подтвердил вход в лобби';

-- Игрок подтверждает вход в лобби (вызов с фронта по кнопке «Подтвердить матч»)
create or replace function public.accept_lobby_match(p_match_id text, p_player_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  v_match record;
begin
  select id, player_a_id, player_b_id into v_match
  from public.matches
  where id::text = p_match_id and result = 'PENDING'
    and (player_a_id = p_player_id or player_b_id = p_player_id);
  if not found then
    return 'Match not found or you are not in this match';
  end if;
  if v_match.player_a_id = p_player_id then
    update public.matches set player_a_accepted_at = coalesce(player_a_accepted_at, now()) where id::text = p_match_id;
  else
    update public.matches set player_b_accepted_at = coalesce(player_b_accepted_at, now()) where id::text = p_match_id;
  end if;
  return null;
end;
$$;

grant execute on function public.accept_lobby_match(text, uuid) to anon;
