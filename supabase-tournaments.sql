-- Модуль турниров: Single Elimination, регистрация, призовой пул (ELO), авто-раунды по времени.
-- Выполни в Supabase SQL Editor после создания таблицы players.

-- Турниры
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Tournament',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'registration', 'ongoing', 'finished')),
  registration_start timestamptz NOT NULL,
  registration_end timestamptz NOT NULL,
  tournament_start timestamptz NOT NULL,
  tournament_end timestamptz NOT NULL,
  round_duration_minutes int NOT NULL DEFAULT 30 CHECK (round_duration_minutes > 0),
  prize_pool jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.tournaments.prize_pool IS 'Array of {place: 1, elo_bonus: 50}. Place 1 = winner, 2 = finalist, 3-4 = semi losers, etc.';

-- Регистрации на турнир
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, player_id)
);

CREATE INDEX IF NOT EXISTS tournament_registrations_tournament_id ON public.tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS tournament_registrations_player_id ON public.tournament_registrations(player_id);

-- Матчи турнира (сетка)
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
CREATE INDEX IF NOT EXISTS tournament_matches_players ON public.tournament_matches(player_a_id, player_b_id);

-- После подтверждения результата — продвинуть победителя в следующий раунд
CREATE OR REPLACE FUNCTION public.tournament_match_after_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('confirmed', 'finished') AND NEW.winner_id IS NOT NULL THEN
    PERFORM tournament_advance_winner(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tournament_match_advance_trigger ON public.tournament_matches;
CREATE TRIGGER tournament_match_advance_trigger
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  WHEN (OLD.winner_id IS DISTINCT FROM NEW.winner_id AND NEW.winner_id IS NOT NULL
        AND NEW.status IN ('confirmed', 'finished'))
  EXECUTE PROCEDURE tournament_match_after_confirm();

-- RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tournaments_select" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_insert" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_update" ON public.tournaments;
CREATE POLICY "tournaments_select" ON public.tournaments FOR SELECT TO public USING (true);
CREATE POLICY "tournaments_insert" ON public.tournaments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "tournaments_update" ON public.tournaments FOR UPDATE TO anon USING (true) WITH CHECK (true);

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

-- Получить турниры со счётчиком заявок
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

-- Закрыть регистрацию и сгенерировать сетку (вызвать при registration_end < now() или вручную из админки)
CREATE OR REPLACE FUNCTION public.tournament_start_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament tournaments%ROWTYPE;
  v_players uuid[];
  v_count int;
  v_rounds int;
  v_round int;
  v_match_idx int;
  v_slot int;
  v_reg record;
  v_scheduled_start timestamptz;
  v_scheduled_end timestamptz;
  v_i int;
  v_target int;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tournament not found');
  END IF;
  IF v_tournament.status != 'registration' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Status is not registration');
  END IF;

  SELECT array_agg(r.player_id ORDER BY (SELECT elo FROM players p WHERE p.id = r.player_id) DESC NULLS LAST)
  INTO v_players
  FROM tournament_registrations r
  WHERE r.tournament_id = p_tournament_id;

  v_count := array_length(v_players, 1);
  IF v_count IS NULL OR v_count < 2 THEN
    DELETE FROM tournaments WHERE id = p_tournament_id;
    RETURN jsonb_build_object('ok', false, 'error', 'Tournament deleted: not enough players (need at least 2)', 'deleted', true);
  END IF;

  -- Приводим число участников к степени двойки (2, 4, 8, 16, 32, 64, 128): лишние с наименьшим ELO удаляются
  v_rounds := greatest(1, floor(ln(v_count) / ln(2))::int);
  v_target := power(2, v_rounds);
  IF v_count > v_target THEN
    DELETE FROM tournament_registrations
    WHERE tournament_id = p_tournament_id
      AND player_id = ANY(v_players[v_target + 1 : v_count]);
    v_players := v_players[1 : v_target];
    v_count := v_target;
  END IF;

  UPDATE tournaments SET status = 'ongoing' WHERE id = p_tournament_id;

  v_round := v_rounds;
  v_scheduled_start := v_tournament.tournament_start;
  v_scheduled_end := v_tournament.tournament_start + (v_tournament.round_duration_minutes || ' minutes')::interval;

  FOR v_round IN REVERSE v_rounds..1 LOOP
    FOR v_match_idx IN 0..(power(2, v_round) - 1) LOOP
      v_scheduled_start := v_tournament.tournament_start + ((v_rounds - v_round) * v_tournament.round_duration_minutes || ' minutes')::interval;
      v_scheduled_end := v_scheduled_start + (v_tournament.round_duration_minutes || ' minutes')::interval;
      IF v_round = v_rounds THEN
        INSERT INTO tournament_matches (tournament_id, round, match_index, player_a_id, player_b_id, scheduled_start, scheduled_end)
        VALUES (
          p_tournament_id,
          v_round,
          v_match_idx,
          v_players[v_match_idx * 2 + 1],
          v_players[v_match_idx * 2 + 2],
          v_scheduled_start,
          v_scheduled_end
        );
      ELSE
        INSERT INTO tournament_matches (tournament_id, round, match_index, player_a_id, player_b_id, scheduled_start, scheduled_end)
        VALUES (p_tournament_id, v_round, v_match_idx, NULL, NULL, v_scheduled_start, v_scheduled_end);
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'players', v_count, 'rounds', v_rounds);
END;
$$;

-- Перевести победителя матча в следующий раунд (player_a/player_b в матче round-1, match_index/2)
CREATE OR REPLACE FUNCTION public.tournament_advance_winner(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_m tournament_matches%ROWTYPE;
  v_next_round int;
  v_next_idx int;
  v_is_a int;
BEGIN
  SELECT * INTO v_m FROM tournament_matches WHERE id = p_match_id;
  IF NOT FOUND OR v_m.winner_id IS NULL THEN RETURN; END IF;
  IF v_m.round <= 1 THEN RETURN; END IF; -- финал — некуда продвигать

  v_next_round := v_m.round - 1;
  v_next_idx := v_m.match_index / 2;
  v_is_a := (v_m.match_index % 2); -- 0 -> player_a, 1 -> player_b

  IF v_is_a = 0 THEN
    UPDATE tournament_matches SET player_a_id = v_m.winner_id
    WHERE tournament_id = v_m.tournament_id AND round = v_next_round AND match_index = v_next_idx;
  ELSE
    UPDATE tournament_matches SET player_b_id = v_m.winner_id
    WHERE tournament_id = v_m.tournament_id AND round = v_next_round AND match_index = v_next_idx;
  END IF;
END;
$$;

-- Обработать матчи с истёкшим временем: авто-победа готового или auto_no_show, продвинуть победителя
CREATE OR REPLACE FUNCTION public.tournament_advance_due_matches(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_new_status text;
  v_winner_id uuid;
BEGIN
  FOR v_row IN
    SELECT m.id, m.status, m.player_a_id, m.player_b_id,
           m.player_a_ready_at, m.player_b_ready_at, m.score_a, m.score_b
    FROM tournament_matches m
    WHERE m.tournament_id = p_tournament_id
      AND m.scheduled_end < now()
      AND m.status NOT IN ('confirmed', 'finished', 'auto_win_a', 'auto_win_b', 'auto_no_show')
  LOOP
    IF v_row.status = 'score_submitted' AND v_row.score_a IS NOT NULL AND v_row.score_b IS NOT NULL THEN
      v_new_status := 'confirmed';
      v_winner_id := CASE WHEN v_row.score_a > v_row.score_b THEN v_row.player_a_id
                          WHEN v_row.score_b > v_row.score_a THEN v_row.player_b_id
                          ELSE NULL END;
    ELSIF v_row.player_a_ready_at IS NOT NULL AND v_row.player_b_ready_at IS NULL THEN
      v_new_status := 'auto_win_a';
      v_winner_id := v_row.player_a_id;
    ELSIF v_row.player_b_ready_at IS NOT NULL AND v_row.player_a_ready_at IS NULL THEN
      v_new_status := 'auto_win_b';
      v_winner_id := v_row.player_b_id;
    ELSE
      v_new_status := 'auto_no_show';
      v_winner_id := NULL;
    END IF;

    UPDATE tournament_matches
    SET status = v_new_status,
        winner_id = v_winner_id,
        score_a = CASE WHEN v_new_status = 'auto_win_a' THEN 3 WHEN v_new_status = 'auto_win_b' THEN 0 ELSE v_row.score_a END,
        score_b = CASE WHEN v_new_status = 'auto_win_b' THEN 3 WHEN v_new_status = 'auto_win_a' THEN 0 ELSE v_row.score_b END
    WHERE id = v_row.id;

    IF v_winner_id IS NOT NULL THEN
      PERFORM tournament_advance_winner(v_row.id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Собрать места в турнире: 1=победитель, 2=финалист, 3-4=полуфинал, 5-8=четверть и т.д.
CREATE OR REPLACE FUNCTION public.tournament_get_standings(p_tournament_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rounds int;
  v_round int;
  v_res uuid[] := '{}';
  v_row record;
BEGIN
  SELECT max(round) INTO v_rounds FROM tournament_matches WHERE tournament_id = p_tournament_id;
  IF v_rounds IS NULL THEN RETURN v_res; END IF;

  -- Место 1: победитель финала (round=1)
  SELECT winner_id INTO v_row FROM tournament_matches
  WHERE tournament_id = p_tournament_id AND round = 1 AND match_index = 0
  AND winner_id IS NOT NULL;
  IF FOUND THEN v_res := v_res || v_row.winner_id; END IF;

  -- Место 2: проигравший в финале (только если финал сыгран)
  FOR v_row IN
    SELECT (CASE WHEN winner_id = player_a_id THEN player_b_id ELSE player_a_id END) AS pid
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id AND round = 1 AND match_index = 0
    AND winner_id IS NOT NULL AND (player_a_id IS NOT NULL OR player_b_id IS NOT NULL)
  LOOP
    IF v_row.pid IS NOT NULL THEN v_res := v_res || v_row.pid; EXIT; END IF;
  END LOOP;

  -- Места 3-4, 5-8, ... — проигравшие в раундах 2, 3, ...
  FOR v_round IN 2..v_rounds LOOP
    FOR v_row IN
      SELECT (CASE WHEN winner_id = player_a_id THEN player_b_id ELSE player_a_id END) AS pid
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id AND round = v_round
      AND winner_id IS NOT NULL AND (player_a_id IS NOT NULL OR player_b_id IS NOT NULL)
      ORDER BY match_index
    LOOP
      IF v_row.pid IS NOT NULL THEN v_res := v_res || v_row.pid; END IF;
    END LOOP;
  END LOOP;

  RETURN v_res;
END;
$$;

-- Завершить турнир и начислить призовые ELO по prize_pool
CREATE OR REPLACE FUNCTION public.tournament_apply_prizes(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_t tournaments%ROWTYPE;
  v_prize jsonb;
  v_place int;
  v_elo int;
  v_player_id uuid;
  v_standings uuid[];
  v_idx int;
BEGIN
  SELECT * INTO v_t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tournament not found');
  END IF;
  IF v_t.status = 'finished' THEN
    RETURN jsonb_build_object('ok', true, 'already_finished', true);
  END IF;
  IF v_t.status != 'ongoing' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tournament not ongoing');
  END IF;

  v_standings := tournament_get_standings(p_tournament_id);

  FOR v_prize IN SELECT * FROM jsonb_array_elements(v_t.prize_pool)
  LOOP
    v_place := (v_prize->>'place')::int;
    v_elo := (v_prize->>'elo_bonus')::int;
    IF v_place < 1 OR v_elo IS NULL OR v_elo < 0 THEN CONTINUE; END IF;
    v_idx := v_place;
    IF v_idx <= array_length(v_standings, 1) THEN
      v_player_id := v_standings[v_idx];
      UPDATE players SET elo = elo + v_elo WHERE id = v_player_id;
    END IF;
  END LOOP;

  UPDATE tournaments SET status = 'finished' WHERE id = p_tournament_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Авто-тик по времени: открыть регистрацию, старт сетки, обработать просроченные матчи, завершить турнир и начислить призовые ELO.
-- Вызывается с фронта каждые ~60 сек при открытой странице турниров. Для гарантированного начисления призов настрой pg_cron:
-- SELECT cron.schedule('tournament_tick', '* * * * *', $$SELECT tournament_tick(NULL)$$);
CREATE OR REPLACE FUNCTION public.tournament_tick(p_tournament_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_t record;
  v_res jsonb;
  v_final_winner uuid;
BEGIN
  FOR v_t IN
    SELECT id, status, registration_start, registration_end, tournament_start, tournament_end
    FROM tournaments
    WHERE (p_tournament_id IS NULL OR id = p_tournament_id)
    AND status IN ('draft', 'registration', 'ongoing')
  LOOP
    IF v_t.status = 'draft' AND now() >= v_t.registration_start THEN
      UPDATE tournaments SET status = 'registration' WHERE id = v_t.id;
    END IF;

    IF v_t.status = 'registration' AND now() >= v_t.registration_end THEN
      SELECT tournament_start_bracket(v_t.id) INTO v_res;
    END IF;

    IF v_t.status = 'ongoing' THEN
      PERFORM tournament_advance_due_matches(v_t.id);
      SELECT winner_id INTO v_final_winner FROM tournament_matches
      WHERE tournament_id = v_t.id AND round = 1 AND match_index = 0 AND winner_id IS NOT NULL;
      IF FOUND THEN
        PERFORM tournament_apply_prizes(v_t.id);
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true);
END;
$$;
