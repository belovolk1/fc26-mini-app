-- Фикс ошибки «new row violates row-level security policy» при отправке жалобы.
-- Выполни в Supabase → SQL Editor (один раз). Можно запускать повторно.

-- Политики для роли authenticated (логин по JWT/Telegram) — без них вставка жалобы блокируется RLS
DROP POLICY IF EXISTS "match_reports select auth" ON public.match_reports;
DROP POLICY IF EXISTS "match_reports insert auth" ON public.match_reports;
DROP POLICY IF EXISTS "match_reports update auth" ON public.match_reports;
CREATE POLICY "match_reports select auth" ON public.match_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "match_reports insert auth" ON public.match_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "match_reports update auth" ON public.match_reports FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "report_resolution_notifications select auth" ON public.report_resolution_notifications;
DROP POLICY IF EXISTS "report_resolution_notifications insert auth" ON public.report_resolution_notifications;
DROP POLICY IF EXISTS "report_resolution_notifications update auth" ON public.report_resolution_notifications;
CREATE POLICY "report_resolution_notifications select auth" ON public.report_resolution_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "report_resolution_notifications insert auth" ON public.report_resolution_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "report_resolution_notifications update auth" ON public.report_resolution_notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- report_telegram_notifications: если RLS включён, без политик вставка из create_match_report падает
ALTER TABLE public.report_telegram_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "report_telegram_notifications insert anon" ON public.report_telegram_notifications;
DROP POLICY IF EXISTS "report_telegram_notifications insert auth" ON public.report_telegram_notifications;
DROP POLICY IF EXISTS "report_telegram_notifications select service" ON public.report_telegram_notifications;
CREATE POLICY "report_telegram_notifications insert anon" ON public.report_telegram_notifications FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "report_telegram_notifications insert auth" ON public.report_telegram_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "report_telegram_notifications select service" ON public.report_telegram_notifications FOR SELECT TO service_role USING (true);

-- Обновить функцию (search_path и явный SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_match_report(
  p_match_type text,
  p_match_id text,
  p_reporter_player_id uuid,
  p_message text,
  p_screenshot_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id uuid;
BEGIN
  IF p_match_type NOT IN ('ladder', 'tournament') OR nullif(trim(p_message), '') IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.match_reports (match_type, match_id, reporter_player_id, message, screenshot_url)
  VALUES (p_match_type, p_match_id, p_reporter_player_id, trim(p_message), nullif(trim(p_screenshot_url), ''))
  RETURNING id INTO v_report_id;
  INSERT INTO public.report_telegram_notifications (report_id) VALUES (v_report_id);
  RETURN v_report_id;
END;
$$;
