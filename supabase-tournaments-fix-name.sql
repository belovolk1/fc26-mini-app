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
