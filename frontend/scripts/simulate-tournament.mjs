/**
 * Симуляция от лица админа: создание турнира, регистрация игроков, старт сетки, удаление.
 * Запуск из корня проекта: node frontend/scripts/simulate-tournament.mjs
 * Нужны переменные: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (из frontend/.env)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env')
if (!existsSync(envPath)) {
  console.error('Нет файла frontend/.env. Скопируй из .env.example и заполни VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const eq = l.indexOf('=')
      const k = l.slice(0, eq).trim()
      const v = l.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      return [k, v]
    })
)
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('В .env нужны VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

const log = (step, msg, data = null) => {
  console.log(`[${step}] ${msg}`)
  if (data != null) console.log('  ', data)
}

async function main() {
  console.log('\n=== Симуляция: админ — турниры ===\n')

  // 1) Получить двух игроков для регистрации
  const { data: players, error: errPlayers } = await supabase
    .from('players')
    .select('id, display_name, username')
    .limit(4)
  if (errPlayers) {
    log('1', 'Ошибка загрузки игроков', errPlayers.message)
    return
  }
  if (!players?.length) {
    log('1', 'В таблице players никого нет. Создай игроков через приложение (вход через Telegram).')
    return
  }
  log('1', 'Игроки для регистрации', players.map((p) => ({ id: p.id.slice(0, 8), name: p.display_name || p.username })))

  const [player1, player2] = players
  const regStart = new Date()
  regStart.setMinutes(regStart.getMinutes() - 10)
  const regEnd = new Date()
  regEnd.setMinutes(regEnd.getMinutes() + 30)
  const tourStart = new Date(regEnd.getTime() + 60 * 60 * 1000)
  const tourEnd = new Date(tourStart.getTime() + 2 * 60 * 60 * 1000)

  // 2) Админ создаёт турнир
  const { data: tour, error: errCreate } = await supabase
    .from('tournaments')
    .insert({
      name: 'Тест симуляции ' + new Date().toISOString().slice(0, 16),
      status: 'registration',
      registration_start: regStart.toISOString(),
      registration_end: regEnd.toISOString(),
      tournament_start: tourStart.toISOString(),
      tournament_end: tourEnd.toISOString(),
      round_duration_minutes: 30,
      prize_pool: [
        { place: 1, elo_bonus: 50 },
        { place: 2, elo_bonus: 30 },
      ],
    })
    .select('id, name, status')
    .single()

  let tournamentId = tour?.id
  const weCreatedTour = !errCreate && tour?.id
  if (errCreate) {
    log('2', 'Ошибка создания турнира', errCreate.message)
    if (errCreate.message.includes('row-level security')) {
      console.log('   → Выполни в Supabase SQL Editor скрипт supabase-tournaments-fix-name.sql (политики INSERT для tournaments).')
    }
    const { data: existingList } = await supabase.from('tournaments').select('id, name, status').limit(1)
    const existing = existingList?.[0]
    if (existing) {
      tournamentId = existing.id
      log('2', 'Используем существующий турнир для проверки', { id: existing.id.slice(0, 8), name: existing.name })
    } else {
      return
    }
  } else {
    log('2', 'Турнир создан', { id: tour.id.slice(0, 8), name: tour.name, status: tour.status })
  }
  if (!tournamentId) return

  // 3) Игроки регистрируются
  for (const p of [player1, player2]) {
    const { error: errReg } = await supabase
      .from('tournament_registrations')
      .insert({ tournament_id: tournamentId, player_id: p.id })
    if (errReg) {
      log('3', `Регистрация ${p.display_name || p.username}`, errReg.message)
    } else {
      log('3', `Зарегистрирован: ${p.display_name || p.username}`)
    }
  }

  // 4) Список турниров (get_tournaments_with_counts)
  const { data: list, error: errList } = await supabase.rpc('get_tournaments_with_counts')
  if (errList) {
    log('4', 'Ошибка списка турниров', errList.message)
  } else {
    const current = (list || []).find((t) => t.id === tournamentId)
    log('4', 'Турнир в списке', current ? { name: current.name, registrations_count: current.registrations_count } : 'не найден')
  }

  // 5) Старт сетки (только если 2+ участника)
  const { data: bracketRes, error: errBracket } = await supabase.rpc('tournament_start_bracket', {
    p_tournament_id: tournamentId,
  })
  if (errBracket) {
    log('5', 'Ошибка старта сетки', errBracket.message)
  } else {
    log('5', 'Старт сетки', bracketRes)
  }

  // 6) Матчи созданы?
  const { data: matches, error: errMatches } = await supabase
    .from('tournament_matches')
    .select('id, round, match_index, player_a_id, player_b_id')
    .eq('tournament_id', tournamentId)
    .order('round', { ascending: false })
  if (errMatches) {
    log('6', 'Ошибка загрузки матчей', errMatches.message)
  } else {
    log('6', 'Матчей в сетке', matches?.length ?? 0)
    if (matches?.length) console.log('   ', matches.map((m) => `r${m.round}m${m.match_index}`).join(', '))
  }

  // 7) Админ удаляет турнир (только если мы его создали в этом запуске)
  if (weCreatedTour) {
    const { error: errDelete } = await supabase.from('tournaments').delete().eq('id', tournamentId)
    if (errDelete) {
      log('7', 'Ошибка удаления турнира', errDelete.message)
      if (errDelete.message.includes('row-level security')) {
        console.log('   → Добавь политику: CREATE POLICY "tournaments_delete" ON tournaments FOR DELETE TO anon USING (true);')
      }
    } else {
      log('7', 'Турнир удалён.')
    }

    const { data: listAfter } = await supabase.rpc('get_tournaments_with_counts')
    const gone = (listAfter || []).find((t) => t.id === tournamentId)
    log('8', gone ? 'Турнир всё ещё в списке (ошибка)' : 'Турнира нет в списке — OK')
  } else {
    log('7', 'Удаление пропущено (турнир не создан этим скриптом).')
    log('8', '—')
  }

  console.log('\n=== Симуляция завершена ===\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
