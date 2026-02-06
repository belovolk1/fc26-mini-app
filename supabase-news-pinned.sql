-- Закрепление до 3 новостей на главной (админ выбирает в админке).
-- Выполни в SQL Editor после supabase-news.sql.

-- Колонка: 1, 2 или 3 — позиция на главной; NULL — не закреплена.
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS pinned_order smallint;

-- Только значения 1, 2, 3 или NULL
ALTER TABLE public.news
  DROP CONSTRAINT IF EXISTS news_pinned_order_check;
ALTER TABLE public.news
  ADD CONSTRAINT news_pinned_order_check CHECK (pinned_order IS NULL OR (pinned_order >= 1 AND pinned_order <= 3));

-- Комментарий
COMMENT ON COLUMN public.news.pinned_order IS 'Позиция закрепления на главной: 1, 2 или 3. NULL — не закреплена.';
