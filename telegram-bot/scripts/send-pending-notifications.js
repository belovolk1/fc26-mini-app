#!/usr/bin/env node
/**
 * One-time send of pending tournament Telegram notifications.
 * Use when the bot is not running or you want to send immediately without waiting for the 1-min poll.
 *
 * From telegram-bot folder:
 *   npm run send-notifications
 *
 * Requires in .env: TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')
const { createClient } = require('@supabase/supabase-js')

const ROUND_REMINDER_MINUTES = 10

const token = process.env.TELEGRAM_BOT_TOKEN
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!token || !supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Set TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const bot = new TelegramBot(token, { polling: false })
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  console.log('=== Sending pending tournament notifications ===\n')

  const { data: rows, error } = await supabase
    .from('tournament_telegram_notifications')
    .select('id, tournament_id, type, match_id')
    .is('sent_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    if (error.code === '42P01') {
      console.error('❌ Table tournament_telegram_notifications not found. Run supabase-tournament-telegram-notifications.sql in Supabase.')
    } else {
      console.error('❌ Error fetching notifications:', error.message)
    }
    process.exit(1)
  }

  if (!rows?.length) {
    console.log('No pending notifications.')
    return
  }

  console.log('Pending:', rows.length)
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

    console.log(`  ${row.type} → ${telegramIds.length} recipient(s)`)
    for (const chatId of telegramIds) {
      try {
        await bot.sendMessage(String(chatId), message)
        await new Promise((r) => setTimeout(r, 80))
      } catch (err) {
        console.error('  Failed to send to', chatId, err.message)
      }
    }
    await supabase.from('tournament_telegram_notifications').update({ sent_at: new Date().toISOString() }).eq('id', row.id)
  }
  console.log('\nDone.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
