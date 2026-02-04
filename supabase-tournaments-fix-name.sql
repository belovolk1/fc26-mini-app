-- Исправление: добавить ВСЕ недостающие колонки в tournaments.
-- Выполни в Supabase → SQL Editor, если при создании турнира ошибки про колонки schema cache.
-- Безопасно: ADD COLUMN IF NOT EXISTS не трогает уже существующие колонки.

-- Таблица tournaments: полный набор колонок по supabase-tournaments.sql
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Tournament',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS registration_start timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS registration_end timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tournament_start timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tournament_end timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS round_duration_minutes int NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS prize_pool jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Ограничение по статусу (если ещё нет — можно выполнить отдельно при необходимости)
-- ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
-- ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_status_check CHECK (status IN ('draft', 'registration', 'ongoing', 'finished'));
-- ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_round_duration_minutes_check;
-- ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_round_duration_minutes_check CHECK (round_duration_minutes > 0);

COMMENT ON COLUMN public.tournaments.name IS 'Tournament display name';
COMMENT ON COLUMN public.tournaments.prize_pool IS 'Array of {place: 1, elo_bonus: 50}. Place 1 = winner, 2 = finalist, etc.';
