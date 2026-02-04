# Realtime для турниров — подробная настройка

Чтобы страница «Турниры» обновлялась в реальном времени (как рейтинг в шапке), нужно включить передачу изменений из БД в Realtime. В Supabase это делается через **публикацию** (publication) `supabase_realtime`.

---

## Способ 1: через веб-интерфейс (самый простой)

1. Открой **Supabase Dashboard**: https://app.supabase.com и выбери свой проект.
2. В левом меню: **Database** → **Replication** (или **Publications** в старых версиях).
3. Найди публикацию **`supabase_realtime`**.
4. Нажми на неё (или «Edit» / «Manage»).
5. В списке таблиц включи (toggle вкл.) для схемы **public**:
   - **tournaments**
   - **tournament_registrations**
   - **tournament_matches**
6. Сохрани изменения.

После этого все INSERT/UPDATE/DELETE по этим таблицам начнут уходить в Realtime, и подписка в приложении будет получать события без перезагрузки страницы.

---

## Способ 2: через SQL (удобно для версионирования и деплоя)

1. Открой **Supabase Dashboard** → **SQL Editor**.
2. Создай новый запрос и вставь содержимое файла **`supabase-realtime-tournaments.sql`** из корня проекта:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_matches;
```

3. Нажми **Run** (или Ctrl+Enter).

Если таблица уже была добавлена в публикацию ранее, для неё появится ошибка вида `table "tournaments" is already member of publication "supabase_realtime"` — это нормально, остальные добавятся.

Чтобы проверить, какие таблицы уже в публикации, выполни в SQL Editor:

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;
```

---

## Что именно начнёт обновляться в реальном времени

| Таблица | События | Что видит пользователь |
|--------|--------|-------------------------|
| **tournaments** | INSERT, UPDATE, DELETE | Новые турниры, смена статуса (draft → registration → ongoing → finished), удаление. |
| **tournament_registrations** | INSERT, DELETE | Изменение числа участников при регистрации/отмене. |
| **tournament_matches** | INSERT, UPDATE | Появление сетки после старта, смена статуса матча (ready → both_ready → score_submitted → confirmed), обновление счёта. |

В приложении при любом таком изменении вызываются `fetchTournaments()` и при открытой сетке — повторная загрузка матчей выбранного турнира. Страницу обновлять не нужно.

---

## Если Realtime не срабатывает

1. **Проверь публикацию** — запросом выше убедись, что все три таблицы есть в `supabase_realtime`.
2. **Realtime включён в проекте** — в Dashboard: **Project Settings** → **API** раздел Realtime не отключён.
3. **Консоль браузера** — при подписке в логах может быть `[FC Area] Realtime: subscribed to matches` (для матчей) или аналогичные сообщения; ошибки подключения тоже будут там.
4. **Сеть** — не блокируют ли прокси/файрвол WebSocket к `*.supabase.co/realtime/v1`.

---

## Опционально: старые значения в событиях (old record)

По умолчанию в payload приходит только новая строка (`new`). Если нужны и старые значения при UPDATE/DELETE (например, для отладки или логирования), для таблицы можно включить полную репликацию:

```sql
ALTER TABLE public.tournaments REPLICA IDENTITY FULL;
ALTER TABLE public.tournament_registrations REPLICA IDENTITY FULL;
ALTER TABLE public.tournament_matches REPLICA IDENTITY FULL;
```

Для текущего сценария (просто обновить список и сетку) это не обязательно.

---

## Ссылки

- [Supabase Realtime — Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Publications (управление таблицами в Realtime)](https://supabase.com/dashboard/project/_/database/publications)
