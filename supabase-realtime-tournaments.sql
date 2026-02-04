-- Realtime для страницы турниров: список турниров, регистрации и сетка обновляются без перезагрузки.
-- Выполни в Supabase → SQL Editor один раз после создания таблиц tournaments, tournament_registrations, tournament_matches.
--
-- Что это даёт: при любом изменении в этих таблицах (создание турнира, регистрация, старт сетки,
-- готовность игроков, ввод/подтверждение счёта) все открытые страницы «Турниры» получают обновление.

-- Добавить таблицы в публикацию supabase_realtime (если таблица уже добавлена, будет ошибка — можно игнорировать)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_matches;

-- ========== ПРОВЕРКА: выполни только этот запрос в SQL Editor, чтобы убедиться, что таблицы в публикации ==========
-- Должно вернуть 3 строки: tournaments, tournament_registrations, tournament_matches
/*
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('tournaments', 'tournament_registrations', 'tournament_matches')
ORDER BY tablename;
*/
