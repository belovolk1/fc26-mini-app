# Настройка вебхуков: уведомления админу в Telegram

Чтобы при новой **жалобе на матч** (Reports) или новом **нарушении рейтинга** (Violations) админу приходило сообщение в Telegram, нужно создать два Database Webhook в Supabase, которые вызывают Edge Function `notify_admin`.

---

## Предварительно

1. Выполнен скрипт **`supabase-admin-notify.sql`** в SQL Editor.
2. Задеплоена функция:  
   `npx supabase functions deploy notify_admin`
3. В настройках проекта заданы секреты функции:
   - **TELEGRAM_BOT_TOKEN** — токен бота.
   - **ADMIN_TELEGRAM_ID** — ваш Telegram chat_id (куда слать уведомления).
   - **NOTIFY_ADMIN_WEBHOOK_SECRET** (по желанию) — секрет для заголовка, чтобы вызывать функцию могли только вебхуки.

---

## Где создавать вебхуки

1. Откройте **Supabase Dashboard**: https://supabase.com/dashboard
2. Выберите свой проект.
3. В левом меню: **Database** → **Webhooks**  
   (или **Integrations** → **Webhooks** — в зависимости от версии интерфейса).
4. Нажмите **Create a new webhook** (или **Add webhook**).

Если пункта «Webhooks» нет, проверьте раздел **Database** → **Hooks** или **Project Settings** → **Integrations**.

---

## Вебхук 1: новые жалобы (match_reports)

| Поле | Значение |
|------|----------|
| **Name** | `notify_admin_new_report` (или любое понятное имя) |
| **Table** | `match_reports` |
| **Events** | отметьте только **Insert** |
| **Type** | HTTP Request (или Webhook) |
| **Method** | POST |
| **URL** | `https://<project-ref>.supabase.co/functions/v1/notify_admin` |

**Подставьте свой project ref вместо `<project-ref>`:**

- В Dashboard: **Project Settings** (иконка шестерёнки) → **General** → **Reference ID**.
- Либо в URL проекта: `https://app.supabase.com/dashboard/project/**rpqnvzfyqrtsjtpwhuse**` — это и есть project ref.

**Пример URL для вашего проекта:**  
`https://rpqnvzfyqrtsjtpwhuse.supabase.co/functions/v1/notify_admin`

**Если задали NOTIFY_ADMIN_WEBHOOK_SECRET:**

- В настройках вебхука найдите блок **HTTP Headers** (или **Advanced**).
- Добавьте заголовок:
  - **Name:** `x-webhook-secret`
  - **Value:** значение переменной `NOTIFY_ADMIN_WEBHOOK_SECRET` (то же, что в секретах функции).

Сохраните вебхук (Create / Save).

---

## Вебхук 2: новые нарушения (rating_violations)

Создайте второй вебхук с теми же настройками, кроме имени и таблицы:

| Поле | Значение |
|------|----------|
| **Name** | `notify_admin_new_violation` |
| **Table** | `rating_violations` |
| **Events** | только **Insert** |
| **Type** | HTTP Request |
| **Method** | POST |
| **URL** | тот же: `https://<project-ref>.supabase.co/functions/v1/notify_admin` |

Если используете секрет — снова добавьте заголовок **x-webhook-secret** с тем же значением.

Сохраните вебхук.

---

## Проверка

1. **Жалоба:** создайте тестовую жалобу на матч через приложение (раздел жалоб после матча). В Telegram должно прийти сообщение вида «Новая жалоба на матч».
2. **Нарушение:** новые нарушения создаются системой античита при детекции; для проверки можно вручную вставить строку в таблицу `rating_violations` через SQL Editor (осторожно, не затроньте реальные данные) и убедиться, что пришло уведомление.

Логи вызовов вебхуков можно смотреть в **Database** → **Webhooks** → выбранный вебхук → история. Логи самой функции — в **Edge Functions** → **notify_admin** → Logs.

---

## Кратко

| Что | Значение |
|-----|----------|
| URL обоих вебхуков | `https://<ваш-project-ref>.supabase.co/functions/v1/notify_admin` |
| Таблица 1 | `match_reports`, событие **Insert** |
| Таблица 2 | `rating_violations`, событие **Insert** |
| Заголовок (если есть секрет) | `x-webhook-secret`: значение из NOTIFY_ADMIN_WEBHOOK_SECRET |
