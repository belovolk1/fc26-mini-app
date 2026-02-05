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

## Keep-alive: чтобы бот не «засыпал» (обязательно для бесплатного плана)

На бесплатном плане Render отключает сервис после **~15 минут** без входящих запросов. После этого уведомления в Telegram не приходят, пока кто-то снова не откроет сервис.

**Решение:** раз в **10 минут** слать запрос на `/health` бота. Скрипт `scripts/render-keepalive.js` делает один GET на `PING_URL/health` — подходит для запуска из Render Cron Job.

### Вариант 1: Cron Job на Render

**Где искать:** зайди в [Dashboard Render](https://dashboard.render.com) → вверху справа нажми **+ New** (или **Add New**) → в списке типов сервиса выбери **Cron Job**. Если пункта «Cron Job» нет, он доступен только на платном плане (~$1/мес); тогда используй Вариант 2 (бесплатно).

1. Подключи репозиторий (например `belovolk1/fc26-mini-app`), укажи **Root Directory:** `telegram-bot`.
2. **Build Command:** `npm install`
3. **Schedule:** `*/10 * * * *` (или выбери «every 10 minutes») — каждые 10 минут.
4. **Command:** `node scripts/render-keepalive.js`
5. **Environment Variables** → Add: **Key** `PING_URL`, **Value** `https://ВАШ-БОТ.onrender.com` (URL вашего Web Service бота, без слэша и без `/health`).
6. **Instance type:** Starter достаточно.

После деплоя Cron Job будет каждые 10 минут запускать скрипт; тот отправит GET на `https://ВАШ-БОТ.onrender.com/health`, и бот не будет уходить в сон.

### Вариант 2: Внешний сервис (бесплатно, если нет Cron Job)

Если в Render не видишь **Cron Job** или не хочешь платить — используй бесплатный пинг снаружи:

- **[UptimeRobot](https://uptimerobot.com)** — Add New Monitor → Type: HTTP(s), URL: `https://ВАШ-БОТ.onrender.com/health`, Interval: 5 min.
- **[cron-job.org](https://cron-job.org)** — Create Cronjob → URL: `https://ВАШ-БОТ.onrender.com/health`, Interval: Every 10 minutes.

Один из них раз в 5–10 минут вызовет твой бот — сервис не будет засыпать.

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
