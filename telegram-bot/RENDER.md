# Деплой бота на Render

## Настройка Web Service

1. **New → Web Service**, репозиторий с проектом (корень — папка `telegram-bot` или корень монорепо с указанием Root Directory `telegram-bot`).

2. **Build Command:** `npm install`

3. **Start Command:** `npm start`

4. **Environment (обязательно):**
   - `TELEGRAM_BOT_TOKEN` — токен от @BotFather
   - `SUPABASE_URL` — URL проекта Supabase (например `https://xxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` — ключ **service_role** из Supabase → Settings → API (не anon!)

   Переменная `PORT` задаётся Render автоматически, бот слушает этот порт для health check.

5. **Health Check Path (опционально):** `/health`  
   Либо оставьте пустым — Render будет проверять ответ на корень `/`.

## Проверка работы уведомлений

- В логах Render должны появляться строки:
  - `HTTP server listening on port ...`
  - раз в минуту при наличии очереди: `Обработка уведомлений: N в очереди`
  - после отправки: `Отправлено: tournament_created → 3 получателей`

- Открой в браузере: `https://<your-service>.onrender.com/health`  
  Должен вернуться JSON с `ok: true`, `lastPollAt`, `lastPendingCount`.

- В Supabase должны быть выполнены:
  - `supabase-tournament-telegram-notifications.sql` (таблица и триггеры)
  - Триггер при создании турнира добавляет запись в `tournament_telegram_notifications`.

- Локально можно проверить очередь: `npm run check-notifications`  
  Ручная отправка очереди: `npm run send-notifications` (нужен `.env` с теми же ключами).
