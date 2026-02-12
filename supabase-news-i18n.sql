-- Мультиязычные новости: заголовок и текст для EN (title, body), RO и RU (отдельные колонки).
-- Выполни после supabase-news.sql и supabase-news-pinned.sql.
-- EN остаётся в title/body; при отсутствии перевода показывается английский.

ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS title_ro text,
  ADD COLUMN IF NOT EXISTS title_ru text,
  ADD COLUMN IF NOT EXISTS body_ro text,
  ADD COLUMN IF NOT EXISTS body_ru text;

COMMENT ON COLUMN public.news.title IS 'Заголовок (English, по умолчанию)';
COMMENT ON COLUMN public.news.body IS 'Текст (English, по умолчанию)';
COMMENT ON COLUMN public.news.title_ro IS 'Заголовок на румынском';
COMMENT ON COLUMN public.news.title_ru IS 'Заголовок на русском';
COMMENT ON COLUMN public.news.body_ro IS 'Текст на румынском';
COMMENT ON COLUMN public.news.body_ru IS 'Текст на русском';
