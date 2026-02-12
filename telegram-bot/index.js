require('dotenv').config()
const http = require('http')
const TelegramBot = require('node-telegram-bot-api')
const { createClient } = require('@supabase/supabase-js')

const PORT = Number(process.env.PORT) || 3000

// Локально ставь ENABLE_TELEGRAM_POLLING=false в .env — polling не запустится, не будет 409 с ботом на Render
const enablePolling = process.env.ENABLE_TELEGRAM_POLLING !== 'false' && process.env.ENABLE_TELEGRAM_POLLING !== '0'

const token = process.env.TELEGRAM_BOT_TOKEN
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!token || !supabaseUrl || !supabaseServiceKey) {
  console.error('Ошибка: не настроены переменные окружения!')
  console.error('Нужны: TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const bot = new TelegramBot(token, { polling: false })
const POLLING_409_RETRY_MS = 60 * 1000 // 1 мин — дать другому инстансу освободить getUpdates
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🤖 Бот запущен и готов к работе!')
console.log('📋 Конфигурация:', {
  tokenLength: token?.length || 0,
  supabaseUrl: supabaseUrl ? '✓' : '✗',
  supabaseKeyLength: supabaseServiceKey?.length || 0,
  telegramPolling: enablePolling ? 'вкл (getUpdates)' : 'выкл (локалка)'
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
      await bot.sendMessage(chatId, '❌ Database connection error. Please try again later.')
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
        `✅ Welcome back, ${firstName || username || 'player'}!\n\n` +
        `Your profile is already linked to Telegram.\n` +
        `Username: ${username || 'not set'}\n` +
        `Telegram ID: ${chatId}\n\n` +
        `You will receive notifications from administrators.`
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
          '❌ Error creating profile. You may already be registered via the website.\n\n' +
          'Try logging in on the site with Telegram, then send /start here again.'
        )
        return
      }

      console.log(`✅ Создан новый пользователь: ${username || chatId}`)

      await bot.sendMessage(
        chatId,
        `🎉 Welcome, ${firstName || username || 'player'}!\n\n` +
        `Your profile has been created and linked to Telegram.\n` +
        `Username: ${username || 'not set'}\n` +
        `Telegram ID: ${chatId}\n` +
        `Starting ELO: 1200\n\n` +
        `You will receive notifications from administrators.\n\n` +
        `Visit the site: https://www.fcarea.com`
      )
    }
  } catch (error) {
    console.error('Неожиданная ошибка:', error)
    await bot.sendMessage(chatId, '❌ Something went wrong. Please try again later or contact an administrator.')
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
    '👋 Hi! I\'m the FC Area bot.\n\n' +
    'Use /start to link your profile to Telegram.'
  )
})

// Обработка ошибок polling (в т.ч. 409 — два инстанса бота)
bot.on('polling_error', async (error) => {
  const msg = error.message || String(error)
  console.error('❌ Ошибка polling:', msg)
  if (error.response && error.response.body) {
    console.error('Полная ошибка:', JSON.stringify({ code: error.code, response: error.response.body }, null, 2))
  }
  // 409 = другой процесс уже держит getUpdates (деплой Render, два инстанса, локальный + Render)
  if (msg.includes('409') || (error.response && error.response.statusCode === 409)) {
    console.warn('⚠️ 409 Conflict: останавливаю polling, перезапуск через', POLLING_409_RETRY_MS / 1000, 'сек…')
    try {
      await bot.stopPolling()
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      console.log('🔄 Перезапуск polling…')
      bot.startPolling().catch((e) => console.error('Ошибка startPolling:', e.message))
    }, POLLING_409_RETRY_MS)
  }
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
    // Вызов tournament_tick раз в минуту: ставит в очередь registration_open за 15 мин до старта,
    // закрывает регистрацию и т.д. Без этого уведомления приходят только если кто-то открыл страницу турниров.
    try {
      await supabase.rpc('tournament_tick', {})
    } catch (tickErr) {
      if (tickErr?.code !== 'PGRST202') console.error('tournament_tick:', tickErr?.message || tickErr)
    }
    await enqueueRoundReminders()
    const { data: rows, error } = await supabase
      .from('tournament_telegram_notifications')
      .select('id, tournament_id, type, match_id')
      .is('sent_at', null)
      .order('created_at', { ascending: true })
    if (error) {
      if (error.code === '42P01') {
        console.error('Таблица tournament_telegram_notifications не найдена. Выполни supabase-tournament-telegram-notifications.sql в Supabase.')
        return
      }
      console.error('Ошибка выборки уведомлений:', error.message)
      return
    }
    lastPollAt = new Date().toISOString()
    lastPendingCount = rows?.length ?? 0
    if (rows?.length) {
      console.log('📤 Обработка уведомлений:', rows.length, 'в очереди')
    }
    if (!rows?.length) return
    for (const row of rows) {
      let telegramIds = []
      let message = ''
      if (row.type === 'tournament_created') {
        const { data: tour } = await supabase.from('tournaments').select('name').eq('id', row.tournament_id).single()
        const { data: players } = await supabase.from('players').select('telegram_id').not('telegram_id', 'is', null)
        telegramIds = (players || []).map((p) => p.telegram_id).filter(Boolean)
        const name = tour?.name || 'Tournament'
        message = `🎉 New tournament «${name}» has been created!\n\nOpen the app to register.`
      } else if (row.type === 'tournament_started') {
        const { data: tour } = await supabase.from('tournaments').select('name').eq('id', row.tournament_id).single()
        const { data: regs } = await supabase.from('tournament_registrations').select('player_id').eq('tournament_id', row.tournament_id)
        if (!regs?.length) {
          await supabase.from('tournament_telegram_notifications').update({ sent_at: new Date().toISOString() }).eq('id', row.id)
          continue
        }
        const playerIds = regs.map((r) => r.player_id)
        const { data: players } = await supabase.from('players').select('telegram_id').in('id', playerIds).not('telegram_id', 'is', null)
        telegramIds = (players || []).map((p) => p.telegram_id).filter(Boolean)
        const name = tour?.name || 'Tournament'
        message = `🏆 Tournament «${name}» has started!\n\nBracket is available in the app — check your match.`
      } else if (row.type === 'registration_open') {
        const { data: tour } = await supabase.from('tournaments').select('name').eq('id', row.tournament_id).single()
        const { data: players } = await supabase.from('players').select('telegram_id').not('telegram_id', 'is', null)
        telegramIds = (players || []).map((p) => p.telegram_id).filter(Boolean)
        const name = tour?.name || 'Tournament'
        message = `📣 Only 15 minutes left to register!\n\nTournament «${name}» starts in 15 minutes. Register in the app or on the site.`
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
        const name = tour?.name || 'Tournament'
        message = `⏰ Your match in tournament «${name}» starts in ${ROUND_REMINDER_MINUTES} minutes.\n\nOpen the app and confirm you're ready to play.`
      }
      let sent = 0
      for (const chatId of telegramIds) {
        try {
          await bot.sendMessage(String(chatId), message)
          sent++
          await new Promise((r) => setTimeout(r, 80))
        } catch (err) {
          console.error('Не удалось отправить уведомление в', chatId, err.message)
        }
      }
      console.log('✅ Отправлено:', row.type, '→', sent, 'получателей')
      await supabase.from('tournament_telegram_notifications').update({ sent_at: new Date().toISOString() }).eq('id', row.id)
    }
  } catch (e) {
    console.error('Ошибка processTournamentNotifications:', e.message)
  }
}

setInterval(processTournamentNotifications, NOTIFICATION_POLL_INTERVAL_MS)
setTimeout(processTournamentNotifications, 5000) // первый запуск через 5 сек

// ========== Уведомления об отмене турнира (0 или 1 участник) ==========
async function processTournamentCancelledNotifications() {
  try {
    const { data: rows, error } = await supabase
      .from('tournament_cancelled_telegram_notifications')
      .select('id, tournament_name')
      .is('sent_at', null)
      .order('created_at', { ascending: true })
    if (error) {
      if (error.code === '42P01') return // таблица не найдена
      console.error('Ошибка выборки tournament_cancelled_telegram_notifications:', error.message)
      return
    }
    if (!rows?.length) return
    const { data: players } = await supabase.from('players').select('telegram_id').not('telegram_id', 'is', null)
    const telegramIds = (players || []).map((p) => p.telegram_id).filter(Boolean)
    for (const row of rows) {
      const message = `❌ Tournament «${row.tournament_name}» has been cancelled: fewer than two participants registered.`
      let sent = 0
      for (const chatId of telegramIds) {
        try {
          await bot.sendMessage(String(chatId), message)
          sent++
          await new Promise((r) => setTimeout(r, 80))
        } catch (err) {
          console.error('Не удалось отправить уведомление об отмене в', chatId, err.message)
        }
      }
      console.log('✅ Отменён турнир уведомлён:', row.tournament_name, '→', sent, 'получателей')
      await supabase.from('tournament_cancelled_telegram_notifications').update({ sent_at: new Date().toISOString() }).eq('id', row.id)
    }
  } catch (e) {
    console.error('Ошибка processTournamentCancelledNotifications:', e.message)
  }
}

setInterval(processTournamentCancelledNotifications, NOTIFICATION_POLL_INTERVAL_MS)
setTimeout(processTournamentCancelledNotifications, 6000)

// ========== Жалобы: уведомление админу в Telegram ==========
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID ? String(process.env.ADMIN_CHAT_ID).trim() : ''

async function processReportNotifications() {
  if (!ADMIN_CHAT_ID) return
  try {
    const { data: rows, error } = await supabase
      .from('report_telegram_notifications')
      .select('id, report_id')
      .is('sent_at', null)
      .order('created_at', { ascending: true })
    if (error) {
      if (error.code === '42P01') return // таблица не найдена
      console.error('Ошибка выборки report_telegram_notifications:', error.message)
      return
    }
    if (!rows?.length) return
    for (const row of rows) {
      const { data: report, error: reportErr } = await supabase
        .from('match_reports')
        .select('match_type, match_id, message, screenshot_url, created_at, reporter_player_id')
        .eq('id', row.report_id)
        .single()
      if (reportErr || !report) {
        await supabase.from('report_telegram_notifications').update({ sent_at: new Date().toISOString() }).eq('id', row.id)
        continue
      }
      let reporterName = '—'
      if (report.reporter_player_id) {
        const { data: p } = await supabase.from('players').select('display_name, username').eq('id', report.reporter_player_id).single()
        reporterName = p?.display_name?.trim() || (p?.username ? `@${p.username}` : '') || report.reporter_player_id.slice(0, 8)
      }
      const typeLabel = report.match_type === 'ladder' ? 'Ladder' : 'Tournament'
      let text = `⚠️ Match report (${typeLabel})\n\nFrom: ${reporterName}\nMatch ID: ${report.match_id}\n\n${report.message || '—'}`
      if (report.screenshot_url) text += `\n\nScreenshot: ${report.screenshot_url}`
      text += `\n\n${new Date(report.created_at).toISOString()}`
      try {
        await bot.sendMessage(ADMIN_CHAT_ID, text)
        await supabase.from('report_telegram_notifications').update({ sent_at: new Date().toISOString() }).eq('id', row.id)
        console.log('✅ Жалоба отправлена админу:', row.report_id)
      } catch (err) {
        console.error('Не удалось отправить жалобу админу:', err.message)
      }
    }
  } catch (e) {
    console.error('Ошибка processReportNotifications:', e.message)
  }
}

setInterval(processReportNotifications, NOTIFICATION_POLL_INTERVAL_MS)
setTimeout(processReportNotifications, 8000)

console.log('✅ Бот успешно запущен! Уведомления турниров: каждые', NOTIFICATION_POLL_INTERVAL_MS / 1000, 'сек.' + (ADMIN_CHAT_ID ? ' Жалобы → админ чат.' : ' (ADMIN_CHAT_ID не задан — жалобы в Telegram не отправляются)'))

// HTTP‑сервер для Render: сервис должен слушать PORT, иначе Render считает его мёртвым
let lastPollAt = null
let lastPendingCount = 0

const server = http.createServer((req, res) => {
  if (req.url === '/health' && (req.method === 'GET' || req.method === 'HEAD')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    if (req.method === 'HEAD') {
      res.end()
      return
    }
    res.end(JSON.stringify({
      ok: true,
      service: 'fc-area-telegram-bot',
      lastPollAt: lastPollAt || null,
      lastPendingCount,
      uptime: process.uptime(),
    }))
    return
  }
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('FC Area Telegram Bot is running. Use /health for status.')
    return
  }
  res.writeHead(404)
  res.end()
})

server.listen(PORT, () => {
  console.log('🌐 HTTP server listening on port', PORT, '(Render health check)')
  if (enablePolling) {
    bot.startPolling().catch((e) => console.error('Ошибка старта polling:', e.message))
  } else {
    console.log('⏸️ Telegram polling отключён (ENABLE_TELEGRAM_POLLING=false). Бот на Render продолжит работать без 409.')
  }
})
