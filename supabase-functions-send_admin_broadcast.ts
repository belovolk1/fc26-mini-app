// Пример Supabase Edge Function для рассылки сообщений в Telegram.
// ЭТОТ ФАЙЛ НУЖНО ПЕРЕНЕСТИ в каталог supabase/functions/send_admin_broadcast/index.ts
// в вашем Supabase-проекте и задеплоить через Supabase CLI.
//
// Требуемые переменные окружения в Supabase:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - TELEGRAM_BOT_TOKEN
// - ADMIN_BROADCAST_SECRET  (секрет, который будет передаваться из фронтенда в заголовке X-Admin-Token)
//
// В players должны быть поля:
// - telegram_id (chat_id пользователя)
// - username (для фильтрации / логов при необходимости)

// Этот файл просто пример и не используется напрямую фронтендом.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

type BroadcastPayload = {
  mode: 'broadcast' | 'single'
  message: string
  minElo?: number
  targetUsername?: string
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const adminSecret = Deno.env.get('ADMIN_BROADCAST_SECRET')
  const headerSecret = req.headers.get('x-admin-token')

  if (!adminSecret || headerSecret !== adminSecret) {
    return new Response('Forbidden', { status: 403 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')

  if (!supabaseUrl || !serviceKey || !botToken) {
    return new Response('Missing server configuration', { status: 500 })
  }

  let body: BroadcastPayload
  try {
    body = (await req.json()) as BroadcastPayload
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!body.message?.trim()) {
    return new Response('Empty message', { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Выбираем целевые чаты
  let playersQuery = supabase
    .from('players')
    .select('telegram_id, username, elo')
    .not('telegram_id', 'is', null)

  if (body.mode === 'single' && body.targetUsername) {
    playersQuery = playersQuery.eq('username', body.targetUsername.replace(/^@/, ''))
  } else if (body.minElo != null) {
    playersQuery = playersQuery.gte('elo', body.minElo)
  }

  const { data: players, error } = await playersQuery

  if (error) {
    console.error('Failed to load players for broadcast', error)
    return new Response('DB error', { status: 500 })
  }

  if (!players || players.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let failed = 0

  for (const p of players as { telegram_id: string; username: string | null }[]) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: p.telegram_id,
          text: body.message,
          parse_mode: 'HTML',
        }),
      })

      if (!resp.ok) {
        failed++
        console.error('Failed to send to', p.username, await resp.text())
      } else {
        sent++
      }

      // Небольшая пауза, чтобы не уткнуться в лимиты Telegram
      await new Promise((r) => setTimeout(r, 60))
    } catch (e) {
      failed++
      console.error('Error sending to', p.username, e)
    }
  }

  return new Response(JSON.stringify({ sent, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

