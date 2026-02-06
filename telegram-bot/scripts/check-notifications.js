#!/usr/bin/env node
/**
 * Скрипт проверки уведомлений турниров в Telegram.
 *
 * Запуск из папки telegram-bot:
 *   npm run check-notifications
 *   или: node scripts/check-notifications.js
 *
 * В .env должны быть: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (те же, что для бота)
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Не заданы SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY в .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('=== Проверка уведомлений турниров ===\n')

  // 1. Таблица уведомлений
  const { data: notifRows, error: notifErr } = await supabase
    .from('tournament_telegram_notifications')
    .select('id, tournament_id, type, match_id, created_at, sent_at')

  if (notifErr) {
    if (notifErr.code === '42P01') {
      console.log('❌ Таблица tournament_telegram_notifications не найдена.')
      console.log('   Выполни в Supabase SQL Editor: supabase-tournament-telegram-notifications.sql\n')
    } else {
      console.log('❌ Ошибка при чтении уведомлений:', notifErr.message, notifErr.code)
    }
  } else {
    const pending = (notifRows || []).filter((r) => !r.sent_at)
    const sent = (notifRows || []).filter((r) => r.sent_at)
    console.log('📋 Очередь уведомлений:')
    console.log('   Всего:', notifRows?.length || 0)
    console.log('   Ожидают отправки (sent_at = null):', pending.length)
    console.log('   Уже отправлены:', sent.length)
    if (pending.length > 0) {
      console.log('\n   Ожидающие:')
      for (const r of pending) {
        console.log('   -', r.type, 'tournament_id:', r.tournament_id, 'match_id:', r.match_id || '—', 'created:', r.created_at)
      }
    }
    console.log('')
  }

  // 2. Турниры и участники с telegram_id
  const { data: tournaments, error: tourErr } = await supabase
    .from('tournaments')
    .select('id, name, status')
    .order('created_at', { ascending: false })
    .limit(20)

  if (!tourErr && tournaments?.length) {
    if (!notifErr && (notifRows?.length || 0) === 0) {
      console.log('⚠️  Турниры есть, но записей в очереди уведомлений нет.')
      console.log('   Вероятно, в Supabase не выполнен триггер при создании турнира.')
      console.log('   Выполни в Supabase SQL Editor: supabase-tournament-telegram-notifications.sql')
      console.log('   (блоки tournament_notify_on_insert и tournament_notify_insert_trigger).\n')
    }
    console.log('🏆 Турниры (последние 20):')
    for (const t of tournaments) {
      const { data: regs } = await supabase
        .from('tournament_registrations')
        .select('player_id')
        .eq('tournament_id', t.id)
      const playerIds = (regs || []).map((r) => r.player_id)
      let withTelegram = 0
      if (playerIds.length > 0) {
        const { data: players } = await supabase
          .from('players')
          .select('telegram_id')
          .in('id', playerIds)
        withTelegram = (players || []).filter((p) => p.telegram_id != null).length
      }
      console.log('   ', t.status.padEnd(12), t.name?.slice(0, 40) || t.id, '| участников:', playerIds.length, '| с telegram_id:', withTelegram)
    }
    console.log('')
  }

  // 3. Игроки с telegram_id
  const { data: playersWithTg, error: plErr } = await supabase
    .from('players')
    .select('id, display_name, username, telegram_id')
    .not('telegram_id', 'is', null)

  if (!plErr) {
    console.log('👤 Игроки с привязанным Telegram (telegram_id):', playersWithTg?.length || 0)
    if (playersWithTg?.length > 0) {
      for (const p of playersWithTg.slice(0, 10)) {
        console.log('   ', p.display_name || p.username || p.id, '| telegram_id:', p.telegram_id)
      }
      if (playersWithTg.length > 10) console.log('   ... и ещё', playersWithTg.length - 10)
    }
    console.log('')
  }

  // 4. Матчи, которые попадут в «напоминание за 10 мин» (следующие 12 мин)
  const from = new Date(Date.now()).toISOString()
  const to = new Date(Date.now() + 12 * 60 * 1000).toISOString()
  const { data: matchesSoon, error: matchErr } = await supabase
    .from('tournament_matches')
    .select('id, tournament_id, round, match_index, scheduled_start, player_a_id, player_b_id')
    .gte('scheduled_start', from)
    .lte('scheduled_start', to)
    .order('scheduled_start', { ascending: true })

  if (!matchErr && matchesSoon?.length) {
    console.log('⏰ Матчи, начинающиеся в ближайшие 12 минут (кандидаты на round_reminder):', matchesSoon.length)
    for (const m of matchesSoon) {
      console.log('   ', m.scheduled_start, '| round:', m.round, 'match_index:', m.match_index, '| tournament_id:', m.tournament_id)
    }
    console.log('')
  } else if (!matchErr) {
    console.log('⏰ Матчей в ближайшие 12 минут нет.\n')
  }

  // 5. Для каждого ожидающего уведомления — сколько получателей
  if (notifErr || !notifRows?.length) return
  const pending = (notifRows || []).filter((r) => !r.sent_at)
  if (pending.length === 0) return

  console.log('📤 Проверка получателей для ожидающих уведомлений:')
  const allPlayersWithTg = (await supabase.from('players').select('telegram_id').not('telegram_id', 'is', null)).data || []
  const totalWithTg = allPlayersWithTg.length

  for (const row of pending) {
    if (row.type === 'tournament_created') {
      const { data: tour } = await supabase.from('tournaments').select('name').eq('id', row.tournament_id).single()
      console.log('   tournament_created:', tour?.name || row.tournament_id, '| получателей (все с telegram_id):', totalWithTg)
      if (totalWithTg === 0) {
        console.log('      ⚠️ Нет ни одного игрока с telegram_id. Напишите боту /start в Telegram.')
      }
    } else if (row.type === 'tournament_started') {
      const { data: regs } = await supabase.from('tournament_registrations').select('player_id').eq('tournament_id', row.tournament_id)
      const playerIds = (regs || []).map((r) => r.player_id)
      const { data: players } = await supabase.from('players').select('telegram_id').in('id', playerIds).not('telegram_id', 'is', null)
      const count = (players || []).length
      const { data: tour } = await supabase.from('tournaments').select('name').eq('id', row.tournament_id).single()
      console.log('   tournament_started:', tour?.name || row.tournament_id, '| участников:', playerIds.length, '| с telegram_id (получат):', count)
      if (count === 0 && playerIds.length > 0) {
        console.log('      ⚠️ У участников нет telegram_id — напишите боту /start в Telegram.')
      }
    } else if (row.type === 'registration_open') {
      const { data: tour } = await supabase.from('tournaments').select('name').eq('id', row.tournament_id).single()
      console.log('   registration_open:', tour?.name || row.tournament_id, '| получателей (все с telegram_id):', totalWithTg)
      if (totalWithTg === 0) {
        console.log('      ⚠️ Нет ни одного игрока с telegram_id. Напишите боту /start в Telegram.')
      }
    } else if (row.type === 'round_reminder' && row.match_id) {
      const { data: match } = await supabase.from('tournament_matches').select('player_a_id, player_b_id').eq('id', row.match_id).single()
      const ids = match ? [match.player_a_id, match.player_b_id].filter(Boolean) : []
      const { data: players } = await supabase.from('players').select('telegram_id').in('id', ids).not('telegram_id', 'is', null)
      const count = (players || []).length
      console.log('   round_reminder match_id:', row.match_id, '| игроков в матче:', ids.length, '| с telegram_id (получат):', count)
    }
  }
  console.log('')
  console.log('Если бот запущен (npm start), он обрабатывает очередь раз в минуту.')
  console.log('Ручная отправка ожидающих: npm run send-notifications')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
