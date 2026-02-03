require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')
const { createClient } = require('@supabase/supabase-js')

const token = process.env.TELEGRAM_BOT_TOKEN
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!token || !supabaseUrl || !supabaseServiceKey) {
  console.error('Ошибка: не настроены переменные окружения!')
  console.error('Нужны: TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const bot = new TelegramBot(token, { polling: true })
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🤖 Бот запущен и готов к работе!')

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id
  const userId = msg.from.id
  const username = msg.from.username || null
  const firstName = msg.from.first_name || null
  const lastName = msg.from.last_name || null

  console.log(`📨 /start от пользователя: ${username || userId} (chat_id: ${chatId})`)

  try {
    // Проверяем, есть ли пользователь в базе
    const { data: existingPlayer, error: fetchError } = await supabase
      .from('players')
      .select('id, username, telegram_id')
      .eq('telegram_id', String(chatId))
      .maybeSingle()

    if (fetchError) {
      console.error('Ошибка при проверке пользователя:', fetchError)
      await bot.sendMessage(chatId, '❌ Ошибка при подключении к базе данных. Попробуйте позже.')
      return
    }

    if (existingPlayer) {
      // Пользователь уже есть - обновляем username если изменился
      if (username && existingPlayer.username !== username) {
        const { error: updateError } = await supabase
          .from('players')
          .update({ username })
          .eq('id', existingPlayer.id)

        if (updateError) {
          console.error('Ошибка при обновлении username:', updateError)
        } else {
          console.log(`✅ Обновлён username для ${chatId}: ${username}`)
        }
      }

      await bot.sendMessage(
        chatId,
        `✅ Добро пожаловать обратно, ${firstName || username || 'игрок'}!\n\n` +
        `Ваш профиль уже подключён к Telegram.\n` +
        `Username: ${username || 'не указан'}\n` +
        `Telegram ID: ${chatId}\n\n` +
        `Теперь вы будете получать уведомления от администраторов.`
      )
    } else {
      // Новый пользователь - создаём запись
      const displayName = [firstName, lastName].filter(Boolean).join(' ') || username || `User${userId}`

      const { data: newPlayer, error: insertError } = await supabase
        .from('players')
        .insert({
          telegram_id: String(chatId),
          username: username,
          display_name: displayName,
          elo: 1200, // Начальный ELO
        })
        .select()
        .single()

      if (insertError) {
        console.error('Ошибка при создании пользователя:', insertError)
        await bot.sendMessage(
          chatId,
          '❌ Ошибка при создании профиля. Возможно, вы уже зарегистрированы через веб-сайт.\n\n' +
          'Попробуйте войти на сайте через Telegram, а затем снова напишите /start здесь.'
        )
        return
      }

      console.log(`✅ Создан новый пользователь: ${username || chatId}`)

      await bot.sendMessage(
        chatId,
        `🎉 Добро пожаловать, ${firstName || username || 'игрок'}!\n\n` +
        `Ваш профиль создан и подключён к Telegram.\n` +
        `Username: ${username || 'не указан'}\n` +
        `Telegram ID: ${chatId}\n` +
        `Начальный ELO: 1200\n\n` +
        `Теперь вы будете получать уведомления от администраторов.\n\n` +
        `Заходите на сайт: https://www.fcarea.com`
      )
    }
  } catch (error) {
    console.error('Неожиданная ошибка:', error)
    await bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже или обратитесь к администратору.')
  }
})

// Обработка всех остальных сообщений
bot.on('message', async (msg) => {
  // Игнорируем команды (они обрабатываются отдельно)
  if (msg.text && msg.text.startsWith('/')) {
    return
  }

  const chatId = msg.chat.id
  await bot.sendMessage(
    chatId,
    '👋 Привет! Я бот для FC Area.\n\n' +
    'Используйте команду /start для подключения вашего профиля к Telegram.'
  )
})

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error)
})

console.log('✅ Бот успешно запущен! Ожидаю сообщений...')
