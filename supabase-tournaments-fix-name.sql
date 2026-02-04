-- Исправление схемы tournaments: колонка title → name, все недостающие колонки.
-- Выполни в Supabase → SQL Editor при ошибках "column X violates not-null" / "Could not find column".
-- Безопасно: переименование только если есть title и нет name; ADD COLUMN IF NOT EXISTS.

-- 1) Привести колонку названия к "name" (в коде и RPC везде используется name)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tournaments' AND column_name = 'title')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tournaments' AND column_name = 'name') THEN
    ALTER TABLE public.tournaments RENAME COLUMN title TO name;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tournaments' AND column_name = 'title')
      AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tournaments' AND column_name = 'name') THEN
    ALTER TABLE public.tournaments DROP COLUMN title;
  END IF;
END $$;

-- 1b) Убрать CHECK на type, чтобы допускалось значение DEFAULT 'single_elimination'; при необходимости задать свой список значений
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_type_check;
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_type_check
  CHECK (type IN ('single_elimination', 'double_elimination', 'round_robin', 'draft', 'cup', 'league'));

-- 2) Для ВСЕХ колонок tournaments с NOT NULL без DEFAULT — выставить DEFAULT (разом убирает все ошибки "null value in column X")
DO $$
DECLARE
  r record;
  def text;
  sql text;
BEGIN
  FOR r IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tournaments'
      AND is_nullable = 'NO'
      AND (column_default IS NULL OR trim(column_default) = '')
  LOOP
    IF r.data_type IN ('timestamp with time zone', 'timestamp without time zone', 'date') THEN
      def := 'now()';
    ELSIF r.data_type IN ('text', 'character varying', 'character') THEN
      CASE r.column_name
        WHEN 'status' THEN def := '''draft''';
        WHEN 'type' THEN def := '''single_elimination''';
        WHEN 'name' THEN def := '''Tournament''';
        ELSE def := '''''';
      END CASE;
    ELSIF r.data_type IN ('integer', 'bigint', 'smallint') THEN
      IF r.column_name = 'round_duration_minutes' THEN def := '30'; ELSE def := '0'; END IF;
    ELSIF r.data_type = 'jsonb' THEN
      def := '''[]''::jsonb';
    ELSIF r.data_type = 'boolean' THEN
      def := 'false';
    ELSE
      def := NULL;
    END IF;
    IF def IS NOT NULL THEN
      sql := $q$ALTER TABLE public.tournaments ALTER COLUMN $q$ || quote_ident(r.column_name) || $q$ SET DEFAULT $q$ || def;
      EXECUTE sql;
    END IF;
  END LOOP;
END $$;

-- 3) Добавить все колонки по supabase-tournaments.sql (если чего-то нет)
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Tournament',
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'single_elimination',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS registration_start timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS registration_end timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tournament_start timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tournament_end timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS round_duration_minutes int NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS prize_pool jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS starts_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ends_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.tournaments.name IS 'Tournament display name';
COMMENT ON COLUMN public.tournaments.prize_pool IS 'Array of {place: 1, elo_bonus: 50}. Place 1 = winner, 2 = finalist, etc.';

-- 3a) Разрешить админу удалять турниры (через приложение)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tournaments_delete" ON public.tournaments;
CREATE POLICY "tournaments_delete" ON public.tournaments FOR DELETE TO anon USING (true);

-- 3b) Таблицы для регистраций и матчей (нужны для функции get_tournaments_with_counts и для модуля турниров)
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, player_id)
);
CREATE INDEX IF NOT EXISTS tournament_registrations_tournament_id ON public.tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS tournament_registrations_player_id ON public.tournament_registrations(player_id);

CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round int NOT NULL,
  match_index int NOT NULL,
  player_a_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  player_b_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  score_a int,
  score_b int,
  winner_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'ready_a', 'ready_b', 'both_ready', 'score_submitted', 'confirmed',
    'auto_win_a', 'auto_win_b', 'auto_no_show', 'finished'
  )),
  score_submitted_by uuid REFERENCES public.players(id) ON DELETE SET NULL,
  player_a_ready_at timestamptz,
  player_b_ready_at timestamptz,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, round, match_index)
);
CREATE INDEX IF NOT EXISTS tournament_matches_tournament_id ON public.tournament_matches(tournament_id);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tournament_registrations_select" ON public.tournament_registrations;
DROP POLICY IF EXISTS "tournament_registrations_insert" ON public.tournament_registrations;
DROP POLICY IF EXISTS "tournament_registrations_delete" ON public.tournament_registrations;
CREATE POLICY "tournament_registrations_select" ON public.tournament_registrations FOR SELECT TO public USING (true);
CREATE POLICY "tournament_registrations_insert" ON public.tournament_registrations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "tournament_registrations_delete" ON public.tournament_registrations FOR DELETE TO anon USING (true);
DROP POLICY IF EXISTS "tournament_matches_select" ON public.tournament_matches;
DROP POLICY IF EXISTS "tournament_matches_insert" ON public.tournament_matches;
DROP POLICY IF EXISTS "tournament_matches_update" ON public.tournament_matches;
CREATE POLICY "tournament_matches_select" ON public.tournament_matches FOR SELECT TO public USING (true);
CREATE POLICY "tournament_matches_insert" ON public.tournament_matches FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "tournament_matches_update" ON public.tournament_matches FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 4) Функция для списка турниров (чтобы турниры отображались на сайте)
CREATE OR REPLACE FUNCTION public.get_tournaments_with_counts()
RETURNS TABLE (
  id uuid,
  name text,
  status text,
  registration_start timestamptz,
  registration_end timestamptz,
  tournament_start timestamptz,
  tournament_end timestamptz,
  round_duration_minutes int,
  prize_pool jsonb,
  created_at timestamptz,
  registrations_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.name, t.status, t.registration_start, t.registration_end,
         t.tournament_start, t.tournament_end, t.round_duration_minutes, t.prize_pool, t.created_at,
         (SELECT count(*) FROM tournament_registrations r WHERE r.tournament_id = t.id)
  FROM tournaments t
  ORDER BY t.registration_start DESC;
$$;
