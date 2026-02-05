#!/usr/bin/env node
/**
 * Keep-alive пинг для Render.
 * Запускается из Cron Job каждые 10 минут и шлёт GET на /health бота,
 * чтобы Web Service не засыпал (иначе после ~15 мин без трафика он отключается).
 *
 * В Cron Job на Render задать:
 *   - Build: npm install
 *   - Start: node scripts/render-keepalive.js
 *   - Env: PING_URL=https://YOUR-BOT-SERVICE.onrender.com
 *   - Schedule: */10 * * * *  (каждые 10 минут)
 */

const https = require('https')
const http = require('http')

const baseUrl = process.env.PING_URL || process.env.RENDER_BOT_URL
if (!baseUrl) {
  console.error('Set PING_URL or RENDER_BOT_URL (e.g. https://your-bot.onrender.com)')
  process.exit(1)
}

const url = baseUrl.replace(/\/$/, '') + '/health'
const isHttps = url.startsWith('https')
const lib = isHttps ? https : http

lib.get(url, (res) => {
  const ok = res.statusCode === 200
  console.log(ok ? `OK ${res.statusCode} ${url}` : `FAIL ${res.statusCode} ${url}`)
  process.exit(ok ? 0 : 1)
}).on('error', (err) => {
  console.error('Ping error:', err.message)
  process.exit(1)
})
