-- Исправление: добавить колонку name в tournaments, если её нет.
-- Выполни в Supabase → SQL Editor, если при создании турнира ошибка про колонку 'name'.

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Tournament';

COMMENT ON COLUMN public.tournaments.name IS 'Tournament display name';
