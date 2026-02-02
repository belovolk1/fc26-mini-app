-- Только функция и триггер для матчмейкинга (таблицу matchmaking_queue не трогаем).
-- Выполни в Supabase → SQL Editor, если у тебя уже есть таблица matchmaking_queue и триггер on_queue_insert.
-- Когда в очереди 2 разных игрока, функция создаёт матч в matches и удаляет их из очереди.

create or replace function public.try_match_after_queue_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  p1 uuid;
  p2 uuid;
  rec record;
begin
  if (select count(*) from public.matchmaking_queue) < 2 then
    return new;
  end if;
  p1 := null;
  p2 := null;
  for rec in select player_id from public.matchmaking_queue order by created_at asc limit 2
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
  after insert on public.matchmaking_queue
  for each row execute function public.try_match_after_queue_insert();
