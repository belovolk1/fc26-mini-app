-- Уведомление в Telegram об отмене турнира (0 или 1 участник по окончании регистрации).
-- Выполни в Supabase → SQL Editor после supabase-tournaments.sql.
-- Турнир при этом удаляется из БД; уведомление хранится в отдельной таблице (без FK на tournaments).

-- Таблица очереди уведомлений «турнир отменён» (без ссылки на tournaments, т.к. турнир удаляется)
CREATE TABLE IF NOT EXISTS public.tournament_cancelled_telegram_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS tournament_cancelled_notifications_pending
  ON public.tournament_cancelled_telegram_notifications(created_at)
  WHERE sent_at IS NULL;

COMMENT ON TABLE public.tournament_cancelled_telegram_notifications IS 'Очередь уведомлений в Telegram об отмене турнира (недостаточно участников). Обрабатывается ботом.';

ALTER TABLE public.tournament_cancelled_telegram_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tournament_cancelled_notifications_service" ON public.tournament_cancelled_telegram_notifications;
CREATE POLICY "tournament_cancelled_notifications_service"
  ON public.tournament_cancelled_telegram_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Обновить tournament_start_bracket: перед удалением турнира (0 или 1 участник) добавить уведомление в очередь
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
    -- Перед удалением — поставить уведомление в очередь (таблица без FK на tournaments)
    INSERT INTO tournament_cancelled_telegram_notifications (tournament_name)
    VALUES (COALESCE(v_tournament.name, 'Tournament'));
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
