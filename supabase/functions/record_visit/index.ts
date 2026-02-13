// Запись визита: страна определяется по IP запроса (надёжно в WebView/Telegram).
// Деплой: supabase functions deploy record_visit
// Переменные: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

type RecordVisitPayload = {
  player_id?: string | null
  anonymous_visitor_id?: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const forwarded = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? ''
  const clientIp = forwarded.split(',')[0]?.trim() || ''

  let country: string | null = null
  if (clientIp) {
    try {
      const r = await fetch(`https://ipapi.co/${encodeURIComponent(clientIp)}/json/`, { method: 'GET' })
      const d = (await r.json()) as { country_code?: string }
      if (d?.country_code && typeof d.country_code === 'string') country = d.country_code
    } catch (_) {}
  }
  if (!country && clientIp) {
    try {
      const r = await fetch(`https://get.geojs.io/v1/ip/geo/${encodeURIComponent(clientIp)}.json`, { method: 'GET' })
      const d = (await r.json()) as { country_code?: string }
      if (d?.country_code && typeof d.country_code === 'string') country = d.country_code
    } catch (_) {}
  }
  if (!country) {
    try {
      const r = await fetch('https://get.geojs.io/v1/ip/geo.json', { method: 'GET' })
      const d = (await r.json()) as { country_code?: string }
      if (d?.country_code && typeof d.country_code === 'string') country = d.country_code
    } catch (_) {}
  }

  let body: RecordVisitPayload = {}
  try {
    body = (await req.json()) as RecordVisitPayload
  } catch {
    body = {}
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response('Missing config', { status: 500, headers: corsHeaders })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const pPlayerId = body.player_id ?? null
  const pAnonymousId = body.anonymous_visitor_id ?? null

  const { error } = await supabase.rpc('record_site_visit', {
    p_country_code: country,
    p_player_id: pPlayerId,
    p_anonymous_visitor_id: pAnonymousId,
    p_ip: clientIp || null,
  })

  if (error) {
    console.error('record_site_visit error', error)
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  return new Response(JSON.stringify({ ok: true, country }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})
