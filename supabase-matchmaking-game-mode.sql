-- Режим быстрого матча: Ultimate Teams (FC 26) vs Original Teams (дружеский).
-- Выполни в Supabase → SQL Editor после supabase-matchmaking.sql.
-- Игроки матчатся только в рамках одного режима.

-- Добавить колонку game_mode в очередь (если её ещё нет)
alter table public.matchmaking_queue
  add column if not exists game_mode text not null default 'original_teams'
  check (game_mode in ('ultimate_teams', 'original_teams'));

-- Уникальность: один игрок в очереди только в одном режиме (перезапись при повторном входе с тем же player_id)
-- Триггер при вставке: ищем пару только среди игроков с тем же game_mode.

create or replace function public.try_match_after_queue_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  p1 uuid;
  p2 uuid;
  rec record;
  v_mode text;
begin
  v_mode := coalesce(NEW.game_mode, 'original_teams');
  if (select count(*) from public.matchmaking_queue where game_mode = v_mode) < 2 then
    return new;
  end if;
  p1 := null;
  p2 := null;
  for rec in select player_id from public.matchmaking_queue where game_mode = v_mode order by created_at asc limit 2
  loop
    if p1 is null then p1 := rec.player_id; else p2 := rec.player_id; end if;
  end loop;
  if p1 is null or p2 is null then return new; end if;
  if p1 = p2 then return new; end if;
  insert into public.matches (player_a_id, player_b_id, result, deadline_at, is_tournament)
  values (p1, p2, 'PENDING', now() + interval '40 minutes', false);
  delete from public.matchmaking_queue where player_id in (p1, p2);
  return new;
end;
$$;

drop trigger if exists on_queue_insert on public.matchmaking_queue;
create trigger on_queue_insert
  after insert or update on public.matchmaking_queue
  for each row execute function public.try_match_after_queue_insert();
