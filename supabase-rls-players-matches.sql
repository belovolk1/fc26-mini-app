-- RLS для доступа к статистике из браузера (вход через виджет «Log in with Telegram»).
-- Если в браузере после входа через виджет статистика не загружается — выполните
-- этот скрипт в Supabase: Dashboard → SQL Editor → New query → вставьте и Run.
-- Если политики с такими именами уже есть, сначала удалите их (DROP POLICY ...).

alter table public.players enable row level security;
alter table public.matches enable row level security;

-- Игроки: anon может читать и создавать/обновлять (upsert по telegram_id)
create policy "players anon select" on public.players
  for select to anon using (true);

create policy "players anon insert" on public.players
  for insert to anon with check (true);

create policy "players anon update" on public.players
  for update to anon using (true) with check (true);

-- Матчи: anon может читать (профиль, лобби, подсчёт матчей) и обновлять (подтверждение счёта)
create policy "matches anon select" on public.matches
  for select to anon using (true);

create policy "matches anon update" on public.matches
  for update to anon using (true) with check (true);
