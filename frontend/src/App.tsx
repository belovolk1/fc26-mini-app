import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

type View = 'home' | 'profile' | 'ladder' | 'tournaments'
type Lang = 'en' | 'ro' | 'ru'

const messages: Record<
  Lang,
  {
    appTitle: string
    appSubtitle: string
    viewTitle: Record<View, string>
    quickPlayTitle: string
    quickPlayText: string
    tournamentsTitle: string
    tournamentsText: string
    profileTileTitle: string
    profileTileText: string
    profileHeader: string
    profilePlayerLabel: string
    profileEloLabel: string
    profileMatchesLabel: string
    profileLoading: string
    profileHint: string
    ladderHeader: string
    ladderText: string
    ladderButton: string
    ladderHint: string
    ladderSearchButton: string
    ladderSearching: string
    ladderCancelSearch: string
    ladderLobbyTitle: string
    ladderLobbyVs: string
    ladderLobbyAgree: string
    ladderManualTitle: string
    ladderMyScore: string
    ladderOppScore: string
    ladderSave: string
    ladderSaved: string
    ladderError: string
    ladderLoginRequired: string
    tournamentsHeader: string
    tournamentsIntro: string
    weeklyCupTitle: string
    weeklyCupSubtitle: string
    doubleLeagueTitle: string
    doubleLeagueSubtitle: string
    tournamentsHint: string
    navHome: string
    navPlay: string
    navTournaments: string
    navProfile: string
    guestName: string
  }
> = {
  en: {
    appTitle: 'FC Area',
    appSubtitle: 'Ladder, tournaments and stats',
    viewTitle: {
      home: 'Home',
      profile: 'Profile',
      ladder: 'Quick play',
      tournaments: 'Tournaments',
    },
    quickPlayTitle: 'Quick play',
    quickPlayText:
      'Find an opponent in seconds and play a match within 40 minutes.',
    tournamentsTitle: 'Tournaments',
    tournamentsText: 'Leagues, play‑offs and double round tournaments.',
    profileTileTitle: 'Profile & stats',
    profileTileText: 'Match history, ELO, win rate and player info.',
    profileHeader: 'Player profile',
    profilePlayerLabel: 'Player',
    profileEloLabel: 'Global ELO rating',
    profileMatchesLabel: 'Matches played',
    profileLoading: 'Loading profile…',
    profileHint:
      'Profile and rating are already stored in Supabase. Later we will add match history and advanced stats.',
    ladderHeader: 'Quick play (ladder)',
    ladderText:
      'Here will be real‑time matchmaking: game mode, queue, 40‑minute deadline and result input.',
    ladderButton: 'Search game',
    ladderHint:
      'Press search — when someone else is searching, you are matched into a lobby. Agree and enter the score.',
    ladderSearchButton: 'Search for opponent',
    ladderSearching: 'Searching for opponent…',
    ladderCancelSearch: 'Cancel',
    ladderLobbyTitle: 'Lobby',
    ladderLobbyVs: 'You vs {name}',
    ladderLobbyAgree: 'Agree and enter the result below.',
    ladderManualTitle: 'Match result',
    ladderMyScore: 'My score',
    ladderOppScore: 'Opponent score',
    ladderSave: 'Submit result',
    ladderSaved: 'Result saved.',
    ladderError: 'Could not save. Try again.',
    ladderLoginRequired: 'Open the app from Telegram to play.',
    tournamentsHeader: 'Tournaments',
    tournamentsIntro:
      'Here will be a list of upcoming tournaments, registration and brackets.',
    weeklyCupTitle: 'Weekly Ladder Cup',
    weeklyCupSubtitle: 'format: single elimination',
    doubleLeagueTitle: 'Double Round League',
    doubleLeagueSubtitle: 'format: double round robin',
    tournamentsHint:
      'Tournament data will later be stored in Supabase tables and managed via admin panel.',
    navHome: 'Home',
    navPlay: 'Play',
    navTournaments: 'Tournaments',
    navProfile: 'Profile',
    guestName: 'Guest',
  },
  ro: {
    appTitle: 'FC Area',
    appSubtitle: 'Ladder, turnee și statistici',
    viewTitle: {
      home: 'Acasă',
      profile: 'Profil',
      ladder: 'Joc rapid',
      tournaments: 'Turnee',
    },
    quickPlayTitle: 'Joc rapid',
    quickPlayText:
      'Găsește un adversar în câteva secunde și joacă un meci în 40 de minute.',
    tournamentsTitle: 'Turnee',
    tournamentsText: 'Ligi, play‑off și turnee double round.',
    profileTileTitle: 'Profil și statistici',
    profileTileText: 'Istoric meciuri, ELO, win rate și info jucător.',
    profileHeader: 'Profil jucător',
    profilePlayerLabel: 'Jucător',
    profileEloLabel: 'Rating ELO global',
    profileMatchesLabel: 'Meciuri jucate',
    profileLoading: 'Se încarcă profilul…',
    profileHint:
      'Profilul și ratingul sunt deja stocate în Supabase. Mai târziu vom adăuga istoric și statistici avansate.',
    ladderHeader: 'Joc rapid (ladder)',
    ladderText:
      'Aici va fi matchmaking în timp real: mod de joc, coadă, termen de 40 de minute și introducerea rezultatului.',
    ladderButton: 'Caută joc',
    ladderHint:
      'Apasă căutarea — când cineva caută, sunteți pereche într-un lobby. Introduceți rezultatul.',
    ladderSearchButton: 'Caută adversar',
    ladderSearching: 'Căutare adversar…',
    ladderCancelSearch: 'Anulare',
    ladderLobbyTitle: 'Lobby',
    ladderLobbyVs: 'Tu vs {name}',
    ladderLobbyAgree: 'Introdu rezultatul mai jos.',
    ladderManualTitle: 'Rezultat meci',
    ladderMyScore: 'Scorul meu',
    ladderOppScore: 'Scorul adversarului',
    ladderSave: 'Trimite rezultatul',
    ladderSaved: 'Rezultat salvat.',
    ladderError: 'Nu s-a putut salva.',
    ladderLoginRequired: 'Deschide aplicația din Telegram pentru a juca.',
    tournamentsHeader: 'Turnee',
    tournamentsIntro:
      'Aici va apărea lista turneelor, înregistrarea și tabloul.',
    weeklyCupTitle: 'Weekly Ladder Cup',
    weeklyCupSubtitle: 'format: eliminare simplă',
    doubleLeagueTitle: 'Double Round League',
    doubleLeagueSubtitle: 'format: double round robin',
    tournamentsHint:
      'Datele turneelor vor fi stocate în tabele Supabase și administrate din panoul de admin.',
    navHome: 'Acasă',
    navPlay: 'Joacă',
    navTournaments: 'Turnee',
    navProfile: 'Profil',
    guestName: 'Vizitator',
  },
  ru: {
    appTitle: 'FC Area',
    appSubtitle: 'Ладдер, турниры и статистика',
    viewTitle: {
      home: 'Главная',
      profile: 'Профиль',
      ladder: 'Быстрая игра',
      tournaments: 'Турниры',
    },
    quickPlayTitle: 'Быстрая игра',
    quickPlayText:
      'Найди соперника за пару секунд и сыграй матч в течение 40 минут.',
    tournamentsTitle: 'Турниры',
    tournamentsText: 'Лиги, плей‑офф и double round турниры.',
    profileTileTitle: 'Профиль и статистика',
    profileTileText: 'История матчей, ELO, винрейт и данные игрока.',
    profileHeader: 'Профиль игрока',
    profilePlayerLabel: 'Игрок',
    profileEloLabel: 'Общий рейтинг ELO',
    profileMatchesLabel: 'Матчей сыграно',
    profileLoading: 'Загружаем профиль…',
    profileHint:
      'Профиль и рейтинг уже хранятся в Supabase. Позже добавим историю матчей и расширенную статистику.',
    ladderHeader: 'Быстрая игра (ладдер)',
    ladderText:
      'Здесь будет поиск соперника в реальном времени: выбор режима, очередь, дедлайн 40 минут и ввод результата.',
    ladderButton: 'Поиск игры',
    ladderHint:
      'Нажмите поиск — когда кто-то тоже ищет, вас соединят в лобби. Договоритесь и введите счёт.',
    ladderSearchButton: 'Искать соперника',
    ladderSearching: 'Ищем соперника…',
    ladderCancelSearch: 'Отмена',
    ladderLobbyTitle: 'Лобби',
    ladderLobbyVs: 'Вы vs {name}',
    ladderLobbyAgree: 'Договоритесь и введите результат ниже.',
    ladderManualTitle: 'Результат матча',
    ladderMyScore: 'Мои голы',
    ladderOppScore: 'Голы соперника',
    ladderSave: 'Отправить результат',
    ladderSaved: 'Результат сохранён.',
    ladderError: 'Не удалось сохранить.',
    ladderLoginRequired: 'Откройте приложение из Telegram, чтобы играть.',
    tournamentsHeader: 'Турниры',
    tournamentsIntro:
      'Здесь появится список ближайших турниров, регистрация и сетка.',
    weeklyCupTitle: 'Weekly Ladder Cup',
    weeklyCupSubtitle: 'формат: single elimination',
    doubleLeagueTitle: 'Double Round League',
    doubleLeagueSubtitle: 'формат: double round robin',
    tournamentsHint:
      'Турнирные данные позже будем хранить в Supabase и управлять через админку.',
    navHome: 'Главная',
    navPlay: 'Игра',
    navTournaments: 'Турниры',
    navProfile: 'Профиль',
    guestName: 'Гость',
  },
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
          }
        }
        themeParams?: Record<string, string>
        ready: () => void
        expand: () => void
      }
    }
  }
}

function App() {
  const [activeView, setActiveView] = useState<View>('home')
  const [lang, setLang] = useState<Lang>('en')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [elo, setElo] = useState<number | null>(null)
  const [matchesCount, setMatchesCount] = useState<number | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  type SearchStatus = 'idle' | 'searching' | 'in_lobby'
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle')
  const [currentMatch, setCurrentMatch] = useState<{
    id: number
    player_a_id: string
    player_b_id: string
  } | null>(null)
  const [opponentName, setOpponentName] = useState<string>('')
  const [scoreA, setScoreA] = useState<string>('')
  const [scoreB, setScoreB] = useState<string>('')
  const [savingMatch, setSavingMatch] = useState(false)
  const [matchMessage, setMatchMessage] = useState<string | null>(null)

  const tg = window.Telegram?.WebApp

  useEffect(() => {
    if (!tg) return
    tg.ready()
    tg.expand()
  }, [tg])

  const user = tg?.initDataUnsafe?.user

  // авто-выбор языка по Telegram, если ещё не меняли вручную
  useEffect(() => {
    const code = user?.language_code?.toLowerCase()
    if (!code) return

    let detected: Lang = 'en'
    if (code.startsWith('ru')) detected = 'ru'
    else if (code.startsWith('ro') || code === 'mo') detected = 'ro'

    setLang((prev) => prev || detected)
  }, [user])

  const t = messages[lang]

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      setLoadingProfile(true)

      // создаём или обновляем игрока по telegram_id
      const { data: upserted, error } = await supabase
        .from('players')
        .upsert(
          {
            telegram_id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
          },
          { onConflict: 'telegram_id' },
        )
        .select()
        .single()

      if (error) {
        console.error('Failed to sync player', error)
        setLoadingProfile(false)
        return
      }

      setPlayerId((upserted as { id: string })?.id ?? null)
      setElo((upserted as { elo?: number })?.elo ?? null)

      // считаем количество сыгранных матчей, где игрок участвует как A или B
      const { count, error: matchesError } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .or(`player_a_id.eq.${upserted.id},player_b_id.eq.${upserted.id}`)

      if (!matchesError) {
        setMatchesCount(count ?? 0)
      }

      setLoadingProfile(false)
    }

    void loadProfile()
  }, [user])

  const displayName = useMemo(() => {
    if (!user) return t.guestName
    if (user.username) return `@${user.username}`
    return [user.first_name, user.last_name].filter(Boolean).join(' ')
  }, [t.guestName, user])

  const refetchMatchesCount = async () => {
    if (!playerId) return
    const { count, error } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .or(`player_a_id.eq.${playerId},player_b_id.eq.${playerId}`)
    if (!error) setMatchesCount(count ?? 0)
  }

  // При входе на экран «Игра» проверяем: в очереди или уже есть лобби
  useEffect(() => {
    if (activeView !== 'ladder' || !playerId) return
    const check = async () => {
      const { data: inQueue } = await supabase
        .from('matchmaking_queue')
        .select('player_id')
        .eq('player_id', playerId)
        .maybeSingle()
      if (inQueue) {
        setSearchStatus('searching')
        return
      }
      const { data: pending } = await supabase
        .from('matches')
        .select('id, player_a_id, player_b_id')
        .eq('result', 'PENDING')
        .or(`player_a_id.eq.${playerId},player_b_id.eq.${playerId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (pending) {
        setCurrentMatch(pending as { id: number; player_a_id: string; player_b_id: string })
        const oppId = pending.player_a_id === playerId ? pending.player_b_id : pending.player_a_id
        const { data: opp } = await supabase.from('players').select('username, first_name, last_name').eq('id', oppId).single()
        const name = opp ? (opp.username ? `@${opp.username}` : [opp.first_name, opp.last_name].filter(Boolean).join(' ') || t.guestName) : t.guestName
        setOpponentName(name)
        setSearchStatus('in_lobby')
      }
    }
    void check()
  }, [activeView, playerId, t.guestName])

  // Опрос: когда в поиске — раз в 2 сек проверяем, появился ли матч
  useEffect(() => {
    if (searchStatus !== 'searching' || !playerId) return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('matches')
        .select('id, player_a_id, player_b_id')
        .eq('result', 'PENDING')
        .or(`player_a_id.eq.${playerId},player_b_id.eq.${playerId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) {
        setCurrentMatch(data as { id: number; player_a_id: string; player_b_id: string })
        const oppId = data.player_a_id === playerId ? data.player_b_id : data.player_a_id
        const { data: opp } = await supabase.from('players').select('username, first_name, last_name').eq('id', oppId).single()
        const name = opp ? (opp.username ? `@${opp.username}` : [opp.first_name, opp.last_name].filter(Boolean).join(' ') || t.guestName) : t.guestName
        setOpponentName(name)
        setSearchStatus('in_lobby')
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [searchStatus, playerId, t.guestName])

  const startSearch = async () => {
    if (!user || !playerId) {
      setMatchMessage(t.ladderLoginRequired)
      return
    }
    setMatchMessage(null)
    const { error } = await supabase.from('matchmaking_queue').upsert(
      { player_id: playerId, created_at: new Date().toISOString() },
      { onConflict: 'player_id' },
    )
    if (error) {
      setMatchMessage(t.ladderError)
      return
    }
    setSearchStatus('searching')
  }

  const cancelSearch = async () => {
    if (!playerId) return
    await supabase.from('matchmaking_queue').delete().eq('player_id', playerId)
    setSearchStatus('idle')
  }

  const submitLobbyResult = async () => {
    if (!currentMatch || !playerId) return
    const myScore = parseInt(scoreA, 10)
    const oppScore = parseInt(scoreB, 10)
    if (Number.isNaN(myScore) || Number.isNaN(oppScore)) {
      setMatchMessage(t.ladderError)
      return
    }
    const isPlayerA = currentMatch.player_a_id === playerId
    const scoreAVal = isPlayerA ? myScore : oppScore
    const scoreBVal = isPlayerA ? oppScore : myScore
    let result: 'A_WIN' | 'B_WIN' | 'DRAW' = 'DRAW'
    if (scoreAVal > scoreBVal) result = 'A_WIN'
    else if (scoreBVal > scoreAVal) result = 'B_WIN'

    setSavingMatch(true)
    setMatchMessage(null)
    const { error } = await supabase
      .from('matches')
      .update({
        score_a: scoreAVal,
        score_b: scoreBVal,
        result,
        played_at: new Date().toISOString(),
      })
      .eq('id', currentMatch.id)

    setSavingMatch(false)
    if (error) {
      setMatchMessage(t.ladderError)
      return
    }
    setMatchMessage(t.ladderSaved)
    setScoreA('')
    setScoreB('')
    setCurrentMatch(null)
    setSearchStatus('idle')
    refetchMatchesCount()
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-main">
          <h1 className="app-title">{t.appTitle}</h1>
          <p className="app-subtitle">{t.appSubtitle}</p>
        </div>
        <div className="lang-switch">
          <button
            type="button"
            className={lang === 'en' ? 'lang-btn active' : 'lang-btn'}
            onClick={() => setLang('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={lang === 'ro' ? 'lang-btn active' : 'lang-btn'}
            onClick={() => setLang('ro')}
          >
            RO
          </button>
          <button
            type="button"
            className={lang === 'ru' ? 'lang-btn active' : 'lang-btn'}
            onClick={() => setLang('ru')}
          >
            RU
          </button>
        </div>
        <div className="app-user">
          <span className="app-user-name">{displayName}</span>
          <span className="app-user-rating">
            ELO: {elo ?? '—'}
          </span>
        </div>
      </header>

      <main className="app-main">
        <h2 className="view-title">{t.viewTitle[activeView]}</h2>

        {activeView === 'home' && (
          <section className="grid">
            <button
              type="button"
              className="tile primary"
              onClick={() => setActiveView('ladder')}
            >
              <span className="tile-title">{t.quickPlayTitle}</span>
              <span className="tile-text">{t.quickPlayText}</span>
            </button>

            <button
              type="button"
              className="tile"
              onClick={() => setActiveView('tournaments')}
            >
              <span className="tile-title">{t.tournamentsTitle}</span>
              <span className="tile-text">{t.tournamentsText}</span>
            </button>

            <button
              type="button"
              className="tile"
              onClick={() => setActiveView('profile')}
            >
              <span className="tile-title">{t.profileTileTitle}</span>
              <span className="tile-text">{t.profileTileText}</span>
            </button>
          </section>
        )}

        {activeView === 'profile' && (
          <section className="panel">
            <h3 className="panel-title">{t.profileHeader}</h3>
            {loadingProfile && (
              <p className="panel-text">{t.profileLoading}</p>
            )}
            <div className="panel-row">
              <span className="label">{t.profilePlayerLabel}</span>
              <span className="value">{displayName}</span>
            </div>
            <div className="panel-row">
              <span className="label">{t.profileEloLabel}</span>
              <span className="value">{elo ?? '—'}</span>
            </div>
            <div className="panel-row">
              <span className="label">{t.profileMatchesLabel}</span>
              <span className="value">
                {matchesCount === null ? '—' : matchesCount}
              </span>
            </div>
            <p className="panel-hint">
              {t.profileHint}
            </p>
          </section>
        )}

        {activeView === 'ladder' && (
          <section className="panel">
            <h3 className="panel-title">{t.ladderHeader}</h3>
            <p className="panel-text">{t.ladderText}</p>

            {!user && (
              <p className="panel-error">{t.ladderLoginRequired}</p>
            )}

            {user && searchStatus === 'idle' && (
              <>
                <button type="button" className="primary-button" onClick={startSearch}>
                  {t.ladderSearchButton}
                </button>
                <p className="panel-hint">{t.ladderHint}</p>
              </>
            )}

            {user && searchStatus === 'searching' && (
              <>
                <p className="panel-text">{t.ladderSearching}</p>
                <button type="button" className="primary-button secondary" onClick={cancelSearch}>
                  {t.ladderCancelSearch}
                </button>
              </>
            )}

            {user && searchStatus === 'in_lobby' && currentMatch && (
              <>
                <h4 className="panel-subtitle">{t.ladderLobbyTitle}</h4>
                <p className="panel-text lobby-vs">
                  {t.ladderLobbyVs.replace('{name}', opponentName)}
                </p>
                <p className="panel-text small">{t.ladderLobbyAgree}</p>
                <div className="form-row">
                  <label className="form-label">{t.ladderMyScore}</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label className="form-label">{t.ladderOppScore}</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                  />
                </div>
                {matchMessage && (
                  <p className={matchMessage === t.ladderSaved ? 'panel-success' : 'panel-error'}>
                    {matchMessage}
                  </p>
                )}
                <button
                  type="button"
                  className="primary-button"
                  disabled={savingMatch}
                  onClick={submitLobbyResult}
                >
                  {savingMatch ? '…' : t.ladderSave}
                </button>
              </>
            )}

            {user && searchStatus === 'idle' && matchMessage && (
              <p className="panel-error">{matchMessage}</p>
            )}
          </section>
        )}

        {activeView === 'tournaments' && (
          <section className="panel">
            <h3 className="panel-title">{t.tournamentsHeader}</h3>
            <p className="panel-text">{t.tournamentsIntro}</p>
            <ul className="list">
              <li className="list-item">
                <span className="list-title">{t.weeklyCupTitle}</span>
                <span className="list-sub">{t.weeklyCupSubtitle}</span>
              </li>
              <li className="list-item">
                <span className="list-title">{t.doubleLeagueTitle}</span>
                <span className="list-sub">{t.doubleLeagueSubtitle}</span>
              </li>
            </ul>
            <p className="panel-hint">
              {t.tournamentsHint}
            </p>
          </section>
        )}
      </main>

      <nav className="app-nav">
        <button
          type="button"
          className={activeView === 'home' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('home')}
        >
          {t.navHome}
        </button>
        <button
          type="button"
          className={activeView === 'ladder' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('ladder')}
        >
          {t.navPlay}
        </button>
        <button
          type="button"
          className={activeView === 'tournaments' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('tournaments')}
        >
          {t.navTournaments}
        </button>
        <button
          type="button"
          className={activeView === 'profile' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('profile')}
        >
          {t.navProfile}
        </button>
      </nav>
    </div>
  )
}

export default App
