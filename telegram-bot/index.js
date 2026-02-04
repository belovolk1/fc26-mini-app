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
console.log('📋 Конфигурация:', {
  tokenLength: token?.length || 0,
  supabaseUrl: supabaseUrl ? '✓' : '✗',
  supabaseKeyLength: supabaseServiceKey?.length || 0
})

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
  console.error('❌ Ошибка polling:', error.message || error)
  console.error('Полная ошибка:', JSON.stringify(error, null, 2))
})

// Логирование успешного подключения
bot.on('polling_error', () => {
  // Это событие срабатывает только при ошибках
})

// Проверка, что бот работает
setTimeout(async () => {
  try {
    const me = await bot.getMe()
    console.log('✅ Бот подключён к Telegram:', {
      id: me.id,
      username: me.username,
      firstName: me.first_name
    })
  } catch (e) {
    console.error('❌ Не удалось получить информацию о боте:', e.message || e)
  }
}, 2000)

// ========== Уведомления турниров: старт турнира (всем) и напоминание перед раундом (участникам матча) ==========
const ROUND_REMINDER_MINUTES = 10 // за сколько минут до начала раунда отправлять напоминание
const NOTIFICATION_POLL_INTERVAL_MS = 60 * 1000 // раз в минуту

async function enqueueRoundReminders() {
  try {
    const from = new Date(Date.now() + (ROUND_REMINDER_MINUTES - 1) * 60 * 1000).toISOString()
    const to = new Date(Date.now() + (ROUND_REMINDER_MINUTES + 1) * 60 * 1000).toISOString()
    const { data: matches, error: matchErr } = await supabase
      .from('tournament_matches')
      .select('id, tournament_id')
      .gte('scheduled_start', from)
      .lte('scheduled_start', to)
    if (matchErr || !matches?.length) return
    for (const m of matches) {
      const { data: existing } = await supabase
        .from('tournament_telegram_notifications')
        .select('id')
        .eq('match_id', m.id)
        .eq('type', 'round_reminder')
        .maybeSingle()
      if (!existing) {
        await supabase.from('tournament_telegram_notifications').insert({
          tournament_id: m.tournament_id,
          type: 'round_reminder',
          match_id: m.id,
        })
      }
    }
  } catch (e) {
    console.error('Ошибка enqueueRoundReminders:', e.message)
  }
}

async function processTournamentNotifications() {
  try {
    await enqueueRoundReminders()
    const { data: rows, error } = await supabase
      .from('tournament_telegram_notifications')
      .select('id, tournament_id, type, match_id')
      .is('sent_at', null)
      .order('created_at', { ascending: true })
    if (error) {
      if (error.code === '42P01') return // table does not exist
      console.error('Ошибка выборки уведомлений:', error.message)
      return
    }
    if (!rows?.length) return
    for (const row of rows) {
      let telegramIds = []
      let message = ''
      if (row.type === 'tournament_started') {
        const { data: tour } = await supabase.from('tournaments').select('name').eq('id', row.tournament_id).single()
        const { data: regs } = await supabase.from('tournament_registrations').select('player_id').eq('tournament_id', row.tournament_id)
        if (!regs?.length) {
          await supabase.from('tournament_telegram_notifications').update({ sent_at: new Date().toISOString() }).eq('id', row.id)
          continue
        }
        const playerIds = regs.map((r) => r.player_id)
        const { data: players } = await supabase.from('players').select('telegram_id').in('id', playerIds).not('telegram_id', 'is', null)
        telegramIds = (players || []).map((p) => p.telegram_id).filter(Boolean)
        const name = tour?.name || 'Турнир'
        message = `🏆 Турнир «${name}» начался!\n\nСетка доступна в приложении — зайдите и проверьте свой матч.`
      } else if (row.type === 'round_reminder' && row.match_id) {
        const { data: match } = await supabase.from('tournament_matches').select('player_a_id, player_b_id').eq('id', row.match_id).single()
        if (!match || (!match.player_a_id && !match.player_b_id)) {
          await supabase.from('tournament_telegram_notifications').update({ sent_at: new Date().toISOString() }).eq('id', row.id)
          continue
        }
        const ids = [match.player_a_id, match.player_b_id].filter(Boolean)
        const { data: players } = await supabase.from('players').select('telegram_id').in('id', ids).not('telegram_id', 'is', null)
        telegramIds = (players || []).map((p) => p.telegram_id).filter(Boolean)
        const { data: tour } = await supabase.from('tournaments').select('name').eq('id', row.tournament_id).single()
        const name = tour?.name || 'Турнир'
        message = `⏰ Через ${ROUND_REMINDER_MINUTES} минут начинается ваш матч в турнире «${name}».\n\nЗайдите в приложение и отметьте готовность к игре.`
      }
      for (const chatId of telegramIds) {
        try {
          await bot.sendMessage(String(chatId), message)
          await new Promise((r) => setTimeout(r, 80))
        } catch (err) {
          console.error('Не удалось отправить уведомление в', chatId, err.message)
        }
      }
      await supabase.from('tournament_telegram_notifications').update({ sent_at: new Date().toISOString() }).eq('id', row.id)
    }
  } catch (e) {
    console.error('Ошибка processTournamentNotifications:', e.message)
  }
}

setInterval(processTournamentNotifications, NOTIFICATION_POLL_INTERVAL_MS)
setTimeout(processTournamentNotifications, 15000) // первый запуск через 15 сек после старта бота

console.log('✅ Бот успешно запущен! Ожидаю сообщений. Уведомления турниров: каждые', NOTIFICATION_POLL_INTERVAL_MS / 1000, 'сек.')
