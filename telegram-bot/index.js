/**
 * FC Area — бот для связи соперников без username.
 * Обрабатывает /start contact_<telegram_id> и отправляет кнопку «Написать сопернику».
 *
 * Токен берётся из:
 * - BOT_TOKEN (в telegram-bot/.env или окружении)
 * - или VITE_TELEGRAM_BOT_ID из frontend/.env (тот же токен из BotFather)
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', 'frontend', '.env') })

const TelegramBot = require('node-telegram-bot-api')

const token = process.env.BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_ID
if (!token) {
  console.error('Задайте BOT_TOKEN или VITE_TELEGRAM_BOT_ID (в frontend/.env или telegram-bot/.env)')
  process.exit(1)
}

const bot = new TelegramBot(token, { polling: true })

bot.on('message', (msg) => {
  const text = (msg.text || '').trim()
  if (!text.startsWith('/start')) return

  const payload = text.slice(6).trim()
  if (!payload.startsWith('contact_')) return

  const telegramId = payload.replace(/^contact_/, '').trim()
  if (!/^\d+$/.test(telegramId)) return

  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Открыть чат с соперником:', {
    reply_markup: {
      inline_keyboard: [[
        { text: '💬 Написать сопернику', url: `tg://user?id=${telegramId}` }
      ]]
    }
  }).catch((err) => {
    console.error('sendMessage error:', err.message)
  })
})

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message)
})

console.log('FC Area bot running (contact_ handler). Ctrl+C to stop.')
