// Уведомление админу в Telegram о новой жалобе (Reports) или новом нарушении (Violations).
// Вызывается из Supabase Database Webhooks при INSERT в match_reports или rating_violations.
// Деплой: npx supabase functions deploy notify_admin
// Переменные: TELEGRAM_BOT_TOKEN, ADMIN_TELEGRAM_ID, NOTIFY_ADMIN_WEBHOOK_SECRET (опционально, задать в заголовке x-webhook-secret при настройке webhook)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

type WebhookPayload = {
  type?: string
  table?: string
  record?: Record<string, unknown>
  schema?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function sendTelegram(chatId: string, text: string, botToken: string): Promise<Response> {
  return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const secret = Deno.env.get('NOTIFY_ADMIN_WEBHOOK_SECRET')
  if (secret) {
    const headerSecret = req.headers.get('x-webhook-secret') || req.headers.get('X-Webhook-Secret')
    if (headerSecret !== secret) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const adminChatId = Deno.env.get('ADMIN_TELEGRAM_ID')
  if (!botToken || !adminChatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or ADMIN_TELEGRAM_ID')
    return new Response(JSON.stringify({ error: 'Server config missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let body: WebhookPayload = {}
  try {
    body = (await req.json()) as WebhookPayload
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const table = body.table
  const record = body.record || {}

  if (table === 'match_reports' && body.type === 'INSERT') {
    const status = record.status as string
    if (status === 'pending') {
      const msg = record.message as string
      const id = record.id as string
      const shortId = id ? String(id).slice(0, 8) : '—'
      const text = `🔔 <b>Новая жалоба на матч</b>\n\nID: ${shortId}…\nСообщение: ${(msg || '—').slice(0, 200)}${(msg && msg.length > 200) ? '…' : ''}\n\nПроверьте раздел «Жалобы» в админке.`
      const res = await sendTelegram(adminChatId, text, botToken)
      if (!res.ok) console.error('Telegram send failed', await res.text())
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }
  }

  if (table === 'rating_violations' && body.type === 'INSERT') {
    const message = record.message as string
    const matchesVoided = record.matches_voided_count as number
    const text = `🔔 <b>Новое нарушение рейтинга</b>\n\nАннулировано матчей: ${matchesVoided ?? '?'}\n${(message || '').slice(0, 300)}\n\nПроверьте раздел «Нарушения» в админке.`
    const res = await sendTelegram(adminChatId, text, botToken)
    if (!res.ok) console.error('Telegram send failed', await res.text())
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }

  return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
})
