-- Политики Storage для бакета avatars (аватары игроков).
-- Путь загрузки в приложении: {player_id}/avatar.{png|jpg}
-- Выполни в Supabase → SQL Editor после создания бакета "avatars".

-- Удалить старые политики шаблона, если создавали по шаблону (имя может отличаться — удали вручную в Dashboard → Storage → avatars → Policies).
-- Ниже создаём политики с фиксированными именами.

-- Чтение: все могут получать файлы из бакета avatars (публичные ссылки на аватары)
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Загрузка: anon может загружать в бакет avatars (путь: uuid/avatar.png или uuid/avatar.jpg)
CREATE POLICY "avatars_anon_upload"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'avatars');

-- Обновление: anon может перезаписывать свой файл (upsert в приложении)
CREATE POLICY "avatars_anon_update"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');
