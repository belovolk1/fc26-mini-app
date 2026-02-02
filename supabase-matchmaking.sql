-- Очередь поиска соперника. Когда 2 разных человека в очереди — триггер создаёт матч (лобби).
-- Выполни в Supabase → SQL Editor.
-- Важно: для матча нужны два разных аккаунта (два player_id). Один аккаунт в двух вкладках не создаст пару.
-- Realtime: в Dashboard → Database → Replication включи публикацию таблицы "matches", чтобы клиенты сразу видели новый матч.

create table if not exists public.matchmaking_queue (
  player_id uuid primary key references public.players(id) on delete cascade,
  created_at timestamptz not null default now()
);

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
  if p1 = p2 then return new; end if;  /* один и тот же игрок — не создаём матч */
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

-- Разрешить фронту (anon) вставлять/читать/удалять из очереди (работает и в браузере на ПК, и в Mini App)
alter table public.matchmaking_queue enable row level security;
create policy "matchmaking_queue all" on public.matchmaking_queue for all using (true) with check (true);
-- Явные политики для anon на случай, если "for all" не применяется к anon в вашем проекте:
drop policy if exists "matchmaking_queue anon select" on public.matchmaking_queue;
create policy "matchmaking_queue anon select" on public.matchmaking_queue for select to anon using (true);
drop policy if exists "matchmaking_queue anon insert" on public.matchmaking_queue;
create policy "matchmaking_queue anon insert" on public.matchmaking_queue for insert to anon with check (true);
drop policy if exists "matchmaking_queue anon delete" on public.matchmaking_queue;
create policy "matchmaking_queue anon delete" on public.matchmaking_queue for delete to anon using (true);
