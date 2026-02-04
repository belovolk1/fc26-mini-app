-- Очередь уведомлений в Telegram при старте турнира и перед раундом.
-- Выполни в Supabase SQL Editor после supabase-tournaments.sql.
--
-- Что делает бот (telegram-bot): раз в минуту проверяет очередь, отправляет:
-- 1) При старте турнира (status -> ongoing) — всем зарегистрированным участникам.
-- 2) За 10 минут до начала матча — только игрокам этого матча (player_a_id, player_b_id).
-- Участники должны иметь telegram_id в таблице players (привязать через /start в боте).

-- Таблица очереди уведомлений
CREATE TABLE IF NOT EXISTS public.tournament_telegram_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('tournament_started', 'round_reminder')),
  match_id uuid REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS tournament_telegram_notifications_pending
  ON public.tournament_telegram_notifications(created_at)
  WHERE sent_at IS NULL;

COMMENT ON TABLE public.tournament_telegram_notifications IS 'Очередь уведомлений в Telegram: старт турнира (всем участникам), напоминание перед раундом (участникам матча). Обрабатывается ботом.';

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

CREATE POLICY "tournament_notifications_service"
  ON public.tournament_telegram_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
