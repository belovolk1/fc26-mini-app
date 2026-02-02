# Обработчик «Message opponent» для бота (соперники без username)

В Mini App ссылка `tg://user?id=...` из WebView не открывает чат. Поэтому при отсутствии у соперника Telegram username приложение открывает **бота** с параметром:

```
https://t.me/YOUR_BOT?start=contact_<TELEGRAM_ID>
```

Пример: `https://t.me/fcarea_bot?start=contact_123456789`

## Реализация в проекте

Готовый бот лежит в папке **`telegram-bot/`**:

- `index.js` — обработка `/start contact_<telegram_id>`, отправка кнопки «Написать сопернику».
- Запуск: `cd telegram-bot && npm install && BOT_TOKEN=xxx node index.js`
- Подробнее: см. `telegram-bot/README.md`

В `.env` фронта задайте имя бота (без @): `VITE_TELEGRAM_BOT_USERNAME=your_bot_username`.
