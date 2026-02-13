-- Уведомления админу: счётчики новых жалоб и нарушений (для бейджа на сайте) и вызов Edge Function для Telegram.
-- Выполни в Supabase SQL Editor. После деплоя Edge Function notify_admin настрой Database Webhooks на таблицы match_reports и rating_violations (INSERT).

-- Счётчики для бейджа в админке (pending reports + нарушения без admin_seen_at)
CREATE OR REPLACE FUNCTION public.get_admin_pending_counts()
RETURNS TABLE (pending_reports bigint, unseen_violations bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::bigint FROM public.match_reports WHERE status = 'pending'),
    (SELECT count(*)::bigint FROM public.rating_violations WHERE admin_seen_at IS NULL);
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_pending_counts() TO anon;
GRANT EXECUTE ON FUNCTION public.get_admin_pending_counts() TO authenticated;

-- Чтобы админ получал уведомления в Telegram при новой жалобе или нарушении:
-- 1) Задеплой Edge Function: npx supabase functions deploy notify_admin
-- 2) В Dashboard задай секреты функции: TELEGRAM_BOT_TOKEN, ADMIN_TELEGRAM_ID, опционально NOTIFY_ADMIN_WEBHOOK_SECRET
-- 3) Создай два Database Webhooks — пошагово см. docs/WEBHOOKS_NOTIFY_ADMIN.md
