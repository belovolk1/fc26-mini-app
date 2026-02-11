-- Очередь уведомлений в Telegram при старте турнира и перед раундом.
-- Выполни в Supabase SQL Editor после supabase-tournaments.sql.
--
-- Что делает бот (telegram-bot): раз в минуту проверяет очередь, отправляет:
-- 1) При создании турнира (INSERT) — всем игрокам с telegram_id.
-- 2) При старте турнира (status -> ongoing) — зарегистрированным участникам этого турнира.
-- 3) За 10 минут до начала матча — только игрокам этого матча (player_a_id, player_b_id).

-- Таблица очереди уведомлений
CREATE TABLE IF NOT EXISTS public.tournament_telegram_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('tournament_created', 'tournament_started', 'registration_open', 'round_reminder')),
  match_id uuid REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS tournament_telegram_notifications_pending
  ON public.tournament_telegram_notifications(created_at)
  WHERE sent_at IS NULL;

-- Обновить CHECK типа, если таблица была создана без 'tournament_created'
ALTER TABLE public.tournament_telegram_notifications
  DROP CONSTRAINT IF EXISTS tournament_telegram_notifications_type_check;
ALTER TABLE public.tournament_telegram_notifications
  ADD CONSTRAINT tournament_telegram_notifications_type_check
  CHECK (type IN ('tournament_created', 'tournament_started', 'registration_open', 'round_reminder'));

COMMENT ON TABLE public.tournament_telegram_notifications IS 'Очередь уведомлений в Telegram: старт турнира (всем участникам), напоминание перед раундом (участникам матча). Обрабатывается ботом.';

-- При создании турнира — уведомление «турнир создан» (получат все, у кого есть telegram_id)
CREATE OR REPLACE FUNCTION public.tournament_notify_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO tournament_telegram_notifications (tournament_id, type)
  VALUES (NEW.id, 'tournament_created');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tournament_notify_insert_trigger ON public.tournaments;
CREATE TRIGGER tournament_notify_insert_trigger
  AFTER INSERT ON public.tournaments
  FOR EACH ROW
  EXECUTE PROCEDURE public.tournament_notify_on_insert();

-- При переходе турнира в статус ongoing — добавить уведомление «турнир начался»
CREATE OR REPLACE FUNCTION public.tournament_notify_on_start()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'ongoing' AND (OLD.status IS NULL OR OLD.status <> 'ongoing') THEN
    INSERT INTO tournament_telegram_notifications (tournament_id, type)
    VALUES (NEW.id, 'tournament_started');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tournament_notify_trigger ON public.tournaments;
CREATE TRIGGER tournament_notify_trigger
  AFTER UPDATE OF status ON public.tournaments
  FOR EACH ROW
  EXECUTE PROCEDURE public.tournament_notify_on_start();

-- RLS: бот использует service role, анонам читать очередь не нужно
ALTER TABLE public.tournament_telegram_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tournament_notifications_service" ON public.tournament_telegram_notifications;
CREATE POLICY "tournament_notifications_service"
  ON public.tournament_telegram_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
