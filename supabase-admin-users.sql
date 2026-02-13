-- Раздел «Пользователи» в админке: поиск, редактирование ELO/данных, деактивация.
-- Выполни в Supabase SQL Editor после supabase-rpc-matches.sql и supabase-rls-players-matches.sql.

-- Флаг активности: неактивные не показываются в рейтинге и не могут искать матчи (проверка в приложении).
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.players.is_active IS 'false = скрыт из рейтинга и не может играть (админ)';

-- Поиск игроков для админки (по username, display_name, first_name, last_name). Возвращает поля для списка и редактирования.
CREATE OR REPLACE FUNCTION public.admin_search_players(p_search text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  first_name text,
  last_name text,
  elo int,
  country_code text,
  is_active boolean,
  created_at timestamptz
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
    p.first_name,
    p.last_name,
    coalesce(p.elo, 1200),
    p.country_code,
    coalesce(p.is_active, true),
    p.created_at
  FROM public.players p
  WHERE (p_search IS NULL OR p_search = '' OR trim(p_search) = '')
     OR p.username ILIKE '%' || trim(p_search) || '%'
     OR p.display_name ILIKE '%' || trim(p_search) || '%'
     OR (coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) ILIKE '%' || trim(p_search) || '%'
  ORDER BY p.is_active DESC, p.created_at DESC
  LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION public.admin_search_players(text) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_search_players(text) TO authenticated;

-- Опционально: исключить неактивных из рейтинга (если у вас get_leaderboard из supabase-rating-anti-cheat.sql).
-- Раскомментируйте и выполните, чтобы неактивные не попадали в таблицу лидеров:
/*
DROP FUNCTION IF EXISTS public.get_leaderboard();
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (rank bigint, player_id uuid, display_name text, avatar_url text, country_code text, elo int, matches_count bigint, wins bigint, draws bigint, losses bigint, goals_for bigint, goals_against bigint, win_rate numeric)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  WITH player_stats AS (
    SELECT p.id, p.elo, p.avatar_url, p.country_code,
      coalesce(nullif(trim(p.display_name), ''), CASE WHEN p.username IS NOT NULL AND p.username <> '' THEN '@' || p.username ELSE nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '') END, '—')::text AS display_name,
      (SELECT count(*)::bigint FROM public.matches m WHERE (m.player_a_id = p.id OR m.player_b_id = p.id) AND m.result IS DISTINCT FROM 'PENDING' AND m.result IS DISTINCT FROM 'CANCELLED' AND coalesce(m.count_for_rating, true) = true) AS matches_count,
      (SELECT count(*)::bigint FROM public.matches m WHERE ((m.player_a_id = p.id AND m.result = 'A_WIN') OR (m.player_b_id = p.id AND m.result = 'B_WIN')) AND coalesce(m.count_for_rating, true) = true) AS wins,
      (SELECT count(*)::bigint FROM public.matches m WHERE (m.player_a_id = p.id OR m.player_b_id = p.id) AND m.result = 'DRAW' AND coalesce(m.count_for_rating, true) = true) AS draws,
      (SELECT count(*)::bigint FROM public.matches m WHERE ((m.player_a_id = p.id AND m.result = 'B_WIN') OR (m.player_b_id = p.id AND m.result = 'A_WIN')) AND coalesce(m.count_for_rating, true) = true) AS losses,
      (SELECT coalesce(sum(CASE WHEN m.player_a_id = p.id THEN m.score_a ELSE m.score_b END), 0)::bigint FROM public.matches m WHERE (m.player_a_id = p.id OR m.player_b_id = p.id) AND m.result IS DISTINCT FROM 'PENDING' AND m.result IS DISTINCT FROM 'CANCELLED' AND coalesce(m.count_for_rating, true) = true) AS goals_for,
      (SELECT coalesce(sum(CASE WHEN m.player_a_id = p.id THEN m.score_b ELSE m.score_a END), 0)::bigint FROM public.matches m WHERE (m.player_a_id = p.id OR m.player_b_id = p.id) AND m.result IS DISTINCT FROM 'PENDING' AND m.result IS DISTINCT FROM 'CANCELLED' AND coalesce(m.count_for_rating, true) = true) AS goals_against
    FROM public.players p
    WHERE coalesce(p.is_active, true) = true
  )
  SELECT row_number() OVER (ORDER BY s.elo DESC NULLS LAST, s.id)::bigint, s.id, s.display_name, s.avatar_url, s.country_code, s.elo, s.matches_count, s.wins, s.draws, s.losses, s.goals_for, s.goals_against,
    round(CASE WHEN s.matches_count > 0 THEN (s.wins * 100.0 / s.matches_count) ELSE NULL END, 1)::numeric
  FROM player_stats s
  WHERE s.matches_count >= 10
  ORDER BY s.elo DESC NULLS LAST, s.id LIMIT 500;
$$;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO anon;
*/
