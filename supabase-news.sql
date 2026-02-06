-- Модуль новостей: таблица + RLS. Картинки — в Storage bucket "news".
-- 1) В Supabase Dashboard → Storage создай бакет с именем "news".
--    Обязательно включи "Public bucket" (публичный бакет), иначе фото не будут отображаться.
-- 2) Выполни этот скрипт в SQL Editor.

-- Таблица новостей
CREATE TABLE IF NOT EXISTS public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Индекс для сортировки на главной
CREATE INDEX IF NOT EXISTS news_created_at_idx ON public.news (created_at DESC);

-- RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Читать могут все (public и anon — фронт по умолчанию подключается как anon)
CREATE POLICY "news_public_read"
ON public.news FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "news_anon_select" ON public.news;
CREATE POLICY "news_anon_select"
ON public.news FOR SELECT
TO anon
USING (true);

-- Вставка/обновление/удаление — anon (админ-форма только у доверенных пользователей в UI)
CREATE POLICY "news_anon_insert"
ON public.news FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "news_anon_update"
ON public.news FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "news_anon_delete"
ON public.news FOR DELETE
TO anon
USING (true);

-- Storage: политики для бакета "news" (создай бакет вручную, если ещё нет).
-- Путь загрузки: {uuid}.jpg или {uuid}.png

CREATE POLICY "news_storage_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'news');

CREATE POLICY "news_storage_anon_insert"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'news');

CREATE POLICY "news_storage_anon_update"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'news')
WITH CHECK (bucket_id = 'news');

CREATE POLICY "news_storage_anon_delete"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'news');
