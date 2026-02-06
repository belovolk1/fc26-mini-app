-- Уведомление в Telegram: «Регистрация открыта» (за 15 минут до старта турнира).
-- Выполни в Supabase → SQL Editor после supabase-tournament-telegram-notifications.sql.
-- При каждом вызове tournament_tick() проверяется: если турнир в статусе registration
-- и наступило время (tournament_start - 15 мин), в очередь добавляется уведомление registration_open.

-- Разрешить новый тип уведомления
ALTER TABLE public.tournament_telegram_notifications
  DROP CONSTRAINT IF EXISTS tournament_telegram_notifications_type_check;
ALTER TABLE public.tournament_telegram_notifications
  ADD CONSTRAINT tournament_telegram_notifications_type_check
  CHECK (type IN ('tournament_created', 'tournament_started', 'registration_open', 'round_reminder'));

-- Обновить tournament_tick: добавить постановку в очередь уведомления «регистрация открыта»
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
  v_exists boolean;
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

    -- За 15 минут до старта — добавить уведомление «регистрация открыта» (один раз на турнир)
    IF v_t.status = 'registration' AND now() >= v_t.tournament_start - interval '15 minutes' THEN
      SELECT EXISTS(
        SELECT 1 FROM tournament_telegram_notifications
        WHERE tournament_id = v_t.id AND type = 'registration_open'
      ) INTO v_exists;
      IF NOT v_exists THEN
        INSERT INTO tournament_telegram_notifications (tournament_id, type)
        VALUES (v_t.id, 'registration_open');
      END IF;
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
