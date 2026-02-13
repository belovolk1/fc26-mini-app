-- Раздел «Статистика» в админке: визиты по дням/странам и кто онлайн.
-- Выполни в Supabase SQL Editor.

-- Таблица визитов: один запрос на загрузку/открытие приложения (вызов record_site_visit с фронта).
CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_at timestamptz NOT NULL DEFAULT now(),
  country_code text,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_site_visits_visited_at ON public.site_visits (visited_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_country ON public.site_visits (country_code);
CREATE INDEX IF NOT EXISTS idx_site_visits_player ON public.site_visits (player_id);

COMMENT ON TABLE public.site_visits IS 'Визиты на сайт для админ-статистики по дням и странам';

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

COMMENT ON COLUMN public.players.last_seen_at IS 'Последняя активность (heartbeat) — для раздела «кто онлайн» в админке';

-- Записать визит (вызывать при загрузке приложения). Если передан player_id — также обновляет last_seen_at.
CREATE OR REPLACE FUNCTION public.record_site_visit(p_country_code text DEFAULT NULL, p_player_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.site_visits (country_code, player_id)
  VALUES (NULLIF(trim(p_country_code), ''), p_player_id);

  IF p_player_id IS NOT NULL THEN
    UPDATE public.players
    SET last_seen_at = now()
    WHERE id = p_player_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_site_visit(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.record_site_visit(text, uuid) TO authenticated;

-- Heartbeat: только обновить last_seen_at (вызывать периодически с фронта для залогиненного пользователя).
CREATE OR REPLACE FUNCTION public.heartbeat(p_player_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.players
  SET last_seen_at = now()
  WHERE id = p_player_id;
$$;

GRANT EXECUTE ON FUNCTION public.heartbeat(uuid) TO authenticated;

-- Статистика визитов по дням, часу и странам (для админки). p_from/p_to — даты включительно.
CREATE OR REPLACE FUNCTION public.admin_get_visits_stats(p_from date DEFAULT NULL, p_to date DEFAULT NULL)
RETURNS TABLE (
  visit_date date,
  visit_hour int,
  country_code text,
  visits_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    (visited_at AT TIME ZONE 'UTC')::date AS visit_date,
    extract(hour FROM (visited_at AT TIME ZONE 'UTC'))::int AS visit_hour,
    coalesce(NULLIF(trim(country_code), ''), '(без страны)') AS country_code,
    count(*)::bigint AS visits_count
  FROM public.site_visits
  WHERE (p_from IS NULL OR (visited_at AT TIME ZONE 'UTC')::date >= p_from)
    AND (p_to IS NULL OR (visited_at AT TIME ZONE 'UTC')::date <= p_to)
  GROUP BY (visited_at AT TIME ZONE 'UTC')::date, extract(hour FROM (visited_at AT TIME ZONE 'UTC')), coalesce(NULLIF(trim(country_code), ''), '(без страны)')
  ORDER BY visit_date DESC, visit_hour, country_code;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_visits_stats(date, date) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_get_visits_stats(date, date) TO authenticated;

-- Кто сейчас онлайн: игроки с last_seen_at за последние 5 минут.
CREATE OR REPLACE FUNCTION public.admin_get_online_players()
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  country_code text,
  last_seen_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.username,
    p.country_code,
    p.last_seen_at
  FROM public.players p
  WHERE p.last_seen_at IS NOT NULL
    AND p.last_seen_at > now() - interval '5 minutes'
    AND coalesce(p.is_active, true) = true
  ORDER BY p.last_seen_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_online_players() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_get_online_players() TO authenticated;

-- RLS: site_visits — вставка для всех (record_site_visit через DEFINER), чтение только через admin RPC (DEFINER).
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_visits_insert ON public.site_visits;
CREATE POLICY site_visits_insert ON public.site_visits FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS site_visits_select ON public.site_visits;
CREATE POLICY site_visits_select ON public.site_visits FOR SELECT TO anon, authenticated USING (false);
