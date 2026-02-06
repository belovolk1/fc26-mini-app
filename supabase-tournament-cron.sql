-- Опционально: запускать tournament_tick каждую минуту через pg_cron.
-- Выполни в Supabase SQL Editor только если установлено расширение pg_cron.
-- Иначе фронт вызывает tournament_tick при открытой странице турниров (~раз в 60 сек).

SELECT cron.schedule(
  'tournament_tick',
  '* * * * *',
  $$SELECT tournament_tick(NULL)$$
);
