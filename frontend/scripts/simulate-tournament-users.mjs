/**
 * Симуляция от лица пользователей: время регистрации, готовность к матчу, автопроигрыш неготового.
 * Запуск: cd frontend && npm run simulate-tournament-users
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env')
if (!existsSync(envPath)) {
  console.error('Нет frontend/.env')
  process.exit(1)
}
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const eq = l.indexOf('=')
      return [l.slice(0, eq).trim(), l.slice(eq + 1).trim().replace(/^["']|["']$/g, '')]
    })
)
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const log = (step, msg, data = null) => {
  console.log(`[${step}] ${msg}`)
  if (data != null) console.log('   ', data)
}

async function main() {
  console.log('\n=== Симуляция: пользователи, время, готовность, автопроигрыш ===\n')

  const now = new Date()
  const regStart = new Date(now.getTime() - 10 * 60 * 1000)
  const regEnd = new Date(now.getTime() + 15 * 60 * 1000)
  const tourStart = new Date(now.getTime() - 60 * 60 * 1000)
  const tourEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  const { data: players } = await supabase.from('players').select('id, display_name, username').limit(2)
  if (!players?.length || players.length < 2) {
    log('0', 'Нужно минимум 2 игрока в таблице players')
    return
  }
  const [playerA, playerB] = players
  log('0', 'Игроки', players.map((p) => p.display_name || p.username))

  // 1) Турнир: регистрация открыта (now между regStart и regEnd), раунд уже "в прошлом" (tourStart давно → слот матча истёк)
  const { data: tour, error: errTour } = await supabase
    .from('tournaments')
    .insert({
      name: 'Тест пользователей ' + now.toISOString().slice(0, 16),
      status: 'registration',
      registration_start: regStart.toISOString(),
      registration_end: regEnd.toISOString(),
      tournament_start: tourStart.toISOString(),
      tournament_end: tourEnd.toISOString(),
      round_duration_minutes: 30,
      prize_pool: [{ place: 1, elo_bonus: 50 }, { place: 2, elo_bonus: 30 }],
    })
    .select('id, name, registration_start, registration_end')
    .single()

  if (errTour) {
    log('1', 'Ошибка создания турнира', errTour.message)
    return
  }
  const tournamentId = tour.id
  const inRegWindow = now.getTime() >= new Date(tour.registration_start).getTime() && now.getTime() < new Date(tour.registration_end).getTime()
  log('1', 'Турнир создан; сейчас в окне регистрации?', inRegWindow ? 'да' : 'нет')

  // 2) Игроки регистрируются (в окне регистрации)
  for (const p of [playerA, playerB]) {
    const { error: e } = await supabase.from('tournament_registrations').insert({ tournament_id: tournamentId, player_id: p.id })
    log('2', (e ? 'Ошибка регистрации ' : 'Зарегистрирован ') + (p.display_name || p.username), e?.message || null)
  }

  // 3) Старт сетки
  const { data: bracket, error: errBracket } = await supabase.rpc('tournament_start_bracket', { p_tournament_id: tournamentId })
  if (errBracket) {
    log('3', 'Ошибка старта сетки', errBracket.message)
    await supabase.from('tournaments').delete().eq('id', tournamentId)
    return
  }
  log('3', 'Сетка создана', bracket)

  // 4) Найти матч (финал для 2 игроков)
  const { data: matches } = await supabase
    .from('tournament_matches')
    .select('id, player_a_id, player_b_id, scheduled_end, status')
    .eq('tournament_id', tournamentId)
  const match = matches?.find((m) => m.player_a_id && m.player_b_id) || matches?.[0]
  if (!match) {
    log('4', 'Матч не найден')
    await supabase.from('tournaments').delete().eq('id', tournamentId)
    return
  }
  const scheduledEnd = new Date(match.scheduled_end)
  const slotOver = now.getTime() > scheduledEnd.getTime()
  log('4', 'Матч найден; слот матча уже истёк?', slotOver ? 'да' : 'нет (scheduled_end в будущем)')

  // 5) Сделать слот истёкшим, если ещё не истёк
  if (!slotOver) {
    const pastEnd = new Date(now.getTime() - 60 * 1000).toISOString()
    await supabase.from('tournament_matches').update({ scheduled_end: pastEnd }).eq('id', match.id)
    log('5', 'scheduled_end сдвинут в прошлое (имитация истечения времени слота)')
  } else {
    log('5', 'Слот уже в прошлом, ничего не меняем')
  }

  // 6) Игрок A нажимает «Готов играть»
  const { error: errReady } = await supabase
    .from('tournament_matches')
    .update({
      player_a_ready_at: new Date().toISOString(),
      status: 'ready_a',
    })
    .eq('id', match.id)
  log('6', errReady ? 'Ошибка отметки готовности A' : 'Игрок A отметился «Готов играть»', errReady?.message || null)

  // 7) Запуск обработки просроченных матчей → ожидаем auto_win_a
  const { error: errAdvance } = await supabase.rpc('tournament_advance_due_matches', { p_tournament_id: tournamentId })
  log('7', errAdvance ? 'Ошибка advance_due_matches' : 'Вызван tournament_advance_due_matches', errAdvance?.message || null)

  const { data: matchAfter } = await supabase
    .from('tournament_matches')
    .select('status, winner_id, score_a, score_b, player_a_id')
    .eq('id', match.id)
    .single()

  const readyPlayerId = match.player_a_id
  const expectedAutoWin = matchAfter?.status === 'auto_win_a' && matchAfter?.winner_id === readyPlayerId
  log('8', expectedAutoWin ? 'OK: автопобеда у того, кто отметил готовность; второй — автопроигрыш 0:3' : 'Проверка автопобеды', {
    status: matchAfter?.status,
    winner_id: matchAfter?.winner_id?.slice(0, 8),
    score: matchAfter ? `${matchAfter.score_a}:${matchAfter.score_b}` : null,
  })
  if (!expectedAutoWin) {
    console.log('   Ожидалось: status=auto_win_a, winner_id = игрок, который нажал «Готов» (player_a в матче)')
  }

  // 9) Удалить тестовый турнир
  await supabase.from('tournaments').delete().eq('id', tournamentId)
  log('9', 'Тестовый турнир удалён')

  console.log('\n=== Симуляция завершена ===\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
