import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
    profileTelegramTitle: string
    profileTelegramConnected: string
    profileTelegramUsername: string
    profileTelegramId: string
    profileTelegramNotConnected: string
    profileBrowserHint: string
    profileTelegramOpenBtn: string
    profileTelegramOrOpen: string
    profileTelegramLoginLabel: string
    profileTelegramWidgetHint: string
    profileTelegramChatOnly: string
    profileTelegramMenuHint: string
    profileTelegramStep2: string
    profileTelegramBotfatherHint: string
    profileTelegramSetDomain: string
    profileTelegramNoRedirect: string
    profileLogout: string
    profileHint: string
    profileError: string
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
    ladderSubmitScore: string
    ladderWaitingConfirm: string
    ladderOpponentProposed: string
    ladderConfirmResult: string
    ladderResultConfirmed: string
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
    profileTelegramTitle: 'Telegram',
    profileTelegramConnected: 'Account linked to Telegram',
    profileTelegramUsername: 'Username',
    profileTelegramId: 'Telegram ID',
    profileTelegramNotConnected: 'To see your stats here in the browser, log in with Telegram using the button below. Your profile will be linked and ELO/matches will load.',
    profileBrowserHint: 'In the browser, your profile (Telegram, ELO, matches) only appears after you log in with the button below. In the Telegram Mini App it appears automatically.',
    profileTelegramOpenBtn: 'Open in Telegram',
    profileTelegramOrOpen: 'Or open the bot in Telegram:',
    profileTelegramLoginLabel: 'Log in with Telegram to link your profile and see stats here:',
    profileTelegramWidgetHint: 'Use the blue "Log in with Telegram" button above (from Telegram). Do NOT click "Open in Telegram" — that only opens the bot chat and does not log you in.',
    profileTelegramChatOnly: 'If the blue button only opens the bot chat and you don\'t see "Allow to log you in?", run /setdomain in BotFather and add your site domain (see below).',
    profileTelegramMenuHint: 'In the bot chat, tap the menu button (☰) or the button below the input to open the app.',
    profileTelegramStep2: 'If only the chat opened: tap the menu button (☰) next to the input, or the button below the input (e.g. "FC Area") to open the app.',
    profileTelegramBotfatherHint: 'If there is no app button: in BotFather run /setmenubutton, select your bot, choose "Web App", enter URL (e.g. https://www.fcarea.com) and button name (e.g. FC Area).',
    profileTelegramSetDomain: 'If you still appear as a guest after logging in: in BotFather run /setdomain, select your bot, and add your site domain (e.g. www.fcarea.com).',
    profileTelegramNoRedirect: 'If Telegram does not redirect you back to the site: in BotFather run /setdomain, select your bot, and add this domain:',
    profileLogout: 'Log out',
    profileHint:
      'Profile and rating are already stored in Supabase. Later we will add match history and advanced stats.',
    profileError: 'Failed to load profile. Check your connection and try again.',
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
    ladderSave: 'Submit score',
    ladderSaved: 'Result saved.',
    ladderSubmitScore: 'Submit score',
    ladderWaitingConfirm: 'Waiting for opponent to confirm.',
    ladderOpponentProposed: 'Opponent proposed score: {score}.',
    ladderConfirmResult: 'Confirm result',
    ladderResultConfirmed: 'Result confirmed.',
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
    profileTelegramTitle: 'Telegram',
    profileTelegramConnected: 'Cont legat de Telegram',
    profileTelegramUsername: 'Username',
    profileTelegramId: 'ID Telegram',
    profileTelegramNotConnected: 'Pentru a vedea statisticile aici în browser, autentifică-te cu Telegram folosind butonul de mai jos. Profilul se va lega și se vor încărca ELO și meciurile.',
    profileBrowserHint: 'În browser, profilul tău (Telegram, ELO, meciuri) apare doar după ce te autentifici cu butonul de mai jos. În Mini App Telegram apare automat.',
    profileTelegramOpenBtn: 'Deschide în Telegram',
    profileTelegramOrOpen: 'Sau deschide botul în Telegram:',
    profileTelegramLoginLabel: 'Autentifică-te cu Telegram pentru a lega profilul și a vedea statisticile aici:',
    profileTelegramWidgetHint: 'Folosește butonul albastru "Log in with Telegram" de mai sus (de la Telegram). NU apăsa "Deschide în Telegram" — acela deschide doar chat-ul cu botul și nu te autentifică.',
    profileTelegramChatOnly: 'Dacă butonul albastru deschide doar chat-ul cu botul și nu vezi "Allow to log you in?", rulează /setdomain în BotFather și adaugă domeniul site-ului (vezi mai jos).',
    profileTelegramMenuHint: 'În chat cu botul, apasă butonul de meniu (☰) sau butonul de sub input pentru a deschide aplicația.',
    profileTelegramStep2: 'Dacă s-a deschis doar chat-ul: apasă butonul de meniu (☰) lângă câmpul de input sau butonul de sub input (ex. "FC Area") pentru a deschide aplicația.',
    profileTelegramBotfatherHint: 'Dacă nu există buton pentru aplicație: în BotFather rulează /setmenubutton, selectează botul, alege "Web App", introdu URL (ex. https://www.fcarea.com) și numele butonului (ex. FC Area).',
    profileTelegramSetDomain: 'Dacă rămâi "oaspete" după login: în BotFather rulează /setdomain, selectează botul și adaugă domeniul site-ului (ex. www.fcarea.com).',
    profileTelegramNoRedirect: 'Dacă Telegram nu te redirecționează înapoi pe site: în BotFather rulează /setdomain, selectează botul și adaugă acest domeniu:',
    profileLogout: 'Deconectare',
    profileHint:
      'Profilul și ratingul sunt deja stocate în Supabase. Mai târziu vom adăuga istoric și statistici avansate.',
    profileError: 'Profilul nu s-a putut încărca. Verifică conexiunea și încearcă din nou.',
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
    ladderSave: 'Trimite scorul',
    ladderSaved: 'Rezultat salvat.',
    ladderSubmitScore: 'Trimite scorul',
    ladderWaitingConfirm: 'Se așteaptă confirmarea adversarului.',
    ladderOpponentProposed: 'Adversarul a propus scorul: {score}.',
    ladderConfirmResult: 'Confirmă rezultatul',
    ladderResultConfirmed: 'Rezultat confirmat.',
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
    profileTelegramTitle: 'Telegram',
    profileTelegramConnected: 'Аккаунт привязан к Telegram',
    profileTelegramUsername: 'Username',
    profileTelegramId: 'ID в Telegram',
    profileTelegramNotConnected: 'Чтобы видеть свою статистику здесь в браузере, войдите через Telegram кнопкой ниже. Профиль привяжется и подгрузятся ELO и матчи.',
    profileBrowserHint: 'В браузере профиль (Telegram, ELO, матчи) показывается только после входа кнопкой ниже. В мини-приложении Telegram он показывается автоматически.',
    profileTelegramOpenBtn: 'Открыть в Telegram',
    profileTelegramOrOpen: 'Или откройте бота в Telegram:',
    profileTelegramLoginLabel: 'Войдите через Telegram, чтобы привязать профиль и видеть статистику здесь:',
    profileTelegramWidgetHint: 'Нажимайте синюю кнопку «Log in with Telegram» выше (от Telegram). Не нажимайте «Открыть в Telegram» — это только ссылка на чат с ботом, она не выполняет вход.',
    profileTelegramChatOnly: 'Если при нажатии синей кнопки открывается только чат с ботом и нет окна «Разрешить вход?» — в BotFather выполните /setdomain и добавьте домен сайта (см. ниже).',
    profileTelegramMenuHint: 'В чате с ботом нажмите кнопку меню (☰) или кнопку под полем ввода, чтобы открыть приложение.',
    profileTelegramStep2: 'Если открылся только чат: нажмите кнопку меню (☰) слева от поля ввода или кнопку под полем ввода (например «FC Area») — откроется приложение.',
    profileTelegramBotfatherHint: 'Если такой кнопки нет: в BotFather выполните /setmenubutton → выберите бота → Web App → укажите URL (например https://www.fcarea.com) и название кнопки (например FC Area).',
    profileTelegramSetDomain: 'Если после входа всё равно показывается «Гость»: в BotFather выполните /setdomain, выберите бота и добавьте домен сайта (например www.fcarea.com).',
    profileTelegramNoRedirect: 'Если Telegram не возвращает на сайт после входа: в BotFather выполните /setdomain, выберите бота и добавьте этот домен:',
    profileLogout: 'Выйти',
    profileHint:
      'Профиль и рейтинг уже хранятся в Supabase. Позже добавим историю матчей и расширенную статистику.',
    profileError: 'Не удалось загрузить профиль. Проверьте подключение и попробуйте снова.',
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
    ladderSave: 'Отправить счёт',
    ladderSaved: 'Результат сохранён.',
    ladderSubmitScore: 'Отправить счёт',
    ladderWaitingConfirm: 'Ожидаем подтверждения соперника.',
    ladderOpponentProposed: 'Соперник предложил счёт: {score}.',
    ladderConfirmResult: 'Подтвердить результат',
    ladderResultConfirmed: 'Результат засчитан.',
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

const WIDGET_USER_KEY = 'fc_area_telegram_user'

type TelegramUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

/** Парсит данные пользователя после редиректа из Telegram Login Widget. Параметры могут быть в hash (#...) или в query (?...). */
function parseWidgetRedirect(): TelegramUser | null {
  const hash = window.location.hash?.slice(1)
  const search = window.location.search?.slice(1)
  const params = new URLSearchParams(hash || search)
  const id = params.get('id')
  const first_name = params.get('first_name')
  if (!id || !first_name) return null
  const numId = parseInt(id, 10)
  if (Number.isNaN(numId)) return null
  return {
    id: numId,
    first_name,
    last_name: params.get('last_name') ?? undefined,
    username: params.get('username') ?? undefined,
  }
}

function getStoredWidgetUser(): TelegramUser | null {
  try {
    const raw = localStorage.getItem(WIDGET_USER_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { id: number; first_name: string; last_name?: string; username?: string }
    if (typeof data.id !== 'number' || typeof data.first_name !== 'string') return null
    return data
  } catch {
    return null
  }
}

function setStoredWidgetUser(user: TelegramUser | null) {
  if (user) localStorage.setItem(WIDGET_USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(WIDGET_USER_KEY)
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: TelegramUser
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
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null)
  const [elo, setElo] = useState<number | null>(null)
  const [matchesCount, setMatchesCount] = useState<number | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  type SearchStatus = 'idle' | 'searching' | 'in_lobby'
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle')
  const [currentMatch, setCurrentMatch] = useState<{
    id: number
    player_a_id: string
    player_b_id: string
    score_a?: number | null
    score_b?: number | null
    score_submitted_by?: string | null
  } | null>(null)
  const [opponentName, setOpponentName] = useState<string>('')
  const [scoreA, setScoreA] = useState<string>('')
  const [scoreB, setScoreB] = useState<string>('')
  const [savingMatch, setSavingMatch] = useState(false)
  const [matchMessage, setMatchMessage] = useState<string | null>(null)
  const widgetContainerRef = useRef<HTMLDivElement>(null)

  const tg = window.Telegram?.WebApp
  const [widgetUser, setWidgetUser] = useState<TelegramUser | null>(() => getStoredWidgetUser())

  useEffect(() => {
    if (!tg) return
    tg.ready()
    tg.expand()
  }, [tg])

  // После редиректа из Telegram Login Widget — парсим параметры (hash или query) и сохраняем пользователя
  useEffect(() => {
    const parsed = parseWidgetRedirect()
    if (parsed) {
      setStoredWidgetUser(parsed)
      setWidgetUser(parsed)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  // Виджет «Войти через Telegram» в браузере (только когда нет WebApp и нет пользователя)
  const showWidget = !tg && !widgetUser && activeView === 'profile'
  useLayoutEffect(() => {
    if (!showWidget) {
      widgetContainerRef.current?.replaceChildren()
      return
    }
    const el = widgetContainerRef.current
    if (!el) return
    // Уже есть виджет (iframe) или скрипт ещё грузится — не пересоздаём
    if (el.querySelector('iframe') || el.querySelector('script[src*="telegram-widget"]')) return
    const botUsername = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string) || 'fcarea_bot'
    const authUrlBase = (import.meta.env.VITE_APP_URL as string) || (window.location.origin + window.location.pathname)
    const authUrl = authUrlBase.replace(/\/$/, '') + '/'
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-auth-url', authUrl)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-request-access', 'write')
    script.async = true
    el.innerHTML = ''
    el.appendChild(script)
    return () => {
      widgetContainerRef.current?.replaceChildren()
    }
  }, [showWidget])

  const user = tg?.initDataUnsafe?.user ?? widgetUser

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
      setProfileLoadError(null)

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
        setProfileLoadError(error.message)
        setLoadingProfile(false)
        return
      }

      setPlayerId((upserted as { id: string })?.id ?? null)
      setElo((upserted as { elo?: number })?.elo ?? null)

      // считаем только подтверждённые матчи (не PENDING)
      const { count, error: matchesError } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .neq('result', 'PENDING')
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
      .neq('result', 'PENDING')
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
        .select('id, player_a_id, player_b_id, score_a, score_b, score_submitted_by')
        .eq('result', 'PENDING')
        .or(`player_a_id.eq.${playerId},player_b_id.eq.${playerId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (pending) {
        setCurrentMatch({
          id: pending.id,
          player_a_id: pending.player_a_id,
          player_b_id: pending.player_b_id,
          score_a: pending.score_a ?? undefined,
          score_b: pending.score_b ?? undefined,
          score_submitted_by: pending.score_submitted_by ?? undefined,
        })
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
        .select('id, player_a_id, player_b_id, score_a, score_b, score_submitted_by')
        .eq('result', 'PENDING')
        .or(`player_a_id.eq.${playerId},player_b_id.eq.${playerId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) {
        setCurrentMatch({
          id: data.id,
          player_a_id: data.player_a_id,
          player_b_id: data.player_b_id,
          score_a: data.score_a ?? undefined,
          score_b: data.score_b ?? undefined,
          score_submitted_by: data.score_submitted_by ?? undefined,
        })
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

  const opponentId = currentMatch
    ? currentMatch.player_a_id === playerId
      ? currentMatch.player_b_id
      : currentMatch.player_a_id
    : null

  const submitLobbyScore = async () => {
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

    setSavingMatch(true)
    setMatchMessage(null)
    const { error } = await supabase
      .from('matches')
      .update({
        score_a: scoreAVal,
        score_b: scoreBVal,
        score_submitted_by: playerId,
      })
      .eq('id', currentMatch.id)

    setSavingMatch(false)
    if (error) {
      setMatchMessage(t.ladderError)
      return
    }
    setMatchMessage(t.ladderSaved)
    setCurrentMatch((m) =>
      m ? { ...m, score_a: scoreAVal, score_b: scoreBVal, score_submitted_by: playerId } : m,
    )
  }

  const confirmLobbyResult = async () => {
    if (!currentMatch || !playerId) return
    const sa = currentMatch.score_a ?? 0
    const sb = currentMatch.score_b ?? 0
    let result: 'A_WIN' | 'B_WIN' | 'DRAW' = 'DRAW'
    if (sa > sb) result = 'A_WIN'
    else if (sb > sa) result = 'B_WIN'

    setSavingMatch(true)
    setMatchMessage(null)
    const { error } = await supabase
      .from('matches')
      .update({
        result,
        played_at: new Date().toISOString(),
      })
      .eq('id', currentMatch.id)

    setSavingMatch(false)
    if (error) {
      setMatchMessage(t.ladderError)
      return
    }
    setMatchMessage(t.ladderResultConfirmed)
    setScoreA('')
    setScoreB('')
    setCurrentMatch(null)
    setSearchStatus('idle')
    refetchMatchesCount()
  }

  return (
    <div className="app">
      <div className="site-header">
        <header className="app-header">
          <div className="app-header-main">
            <h1 className="app-title">{t.appTitle}</h1>
            <p className="app-subtitle">{t.appSubtitle}</p>
          </div>
        </header>
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
        <div className="header-right">
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
        </div>
      </div>

      <main className="app-main">
        {activeView === 'home' && (
          <section className="hero">
            <h2 className="hero-title">{t.appTitle}</h2>
            <p className="hero-subtitle">{t.appSubtitle}</p>
          </section>
        )}

        {activeView !== 'home' && (
          <h2 className="view-title">{t.viewTitle[activeView]}</h2>
        )}

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
            {profileLoadError && (
              <p className="panel-text profile-error">{t.profileError}</p>
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

            <div className="profile-telegram">
              <h4 className="panel-subtitle">{t.profileTelegramTitle}</h4>
              {user ? (
                <>
                  <p className="profile-telegram-status">{t.profileTelegramConnected}</p>
                  <div className="panel-row">
                    <span className="label">{t.profileTelegramUsername}</span>
                    <span className="value">
                      {user.username ? `@${user.username}` : '—'}
                    </span>
                  </div>
                  <div className="panel-row">
                    <span className="label">{t.profileTelegramId}</span>
                    <span className="value profile-telegram-id">{user.id}</span>
                  </div>
                  {widgetUser && !tg && (
                    <button
                      type="button"
                      className="profile-logout-btn"
                      onClick={() => {
                        setStoredWidgetUser(null)
                        setWidgetUser(null)
                      }}
                    >
                      {t.profileLogout}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="panel-text profile-browser-hint">{t.profileBrowserHint}</p>
                  <p className="panel-text profile-telegram-not">{t.profileTelegramNotConnected}</p>
                  <p className="panel-hint profile-telegram-login-label">{t.profileTelegramLoginLabel}</p>
                  <div ref={widgetContainerRef} className="profile-telegram-widget" />
                  <p className="panel-hint profile-telegram-widget-hint">{t.profileTelegramWidgetHint}</p>
                  <p className="panel-hint profile-telegram-menu-hint">
                    {t.profileTelegramMenuHint}
                  </p>
                  <p className="panel-hint profile-telegram-or-open-label">{t.profileTelegramOrOpen}</p>
                  <a
                    href={`https://t.me/${(import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string) || 'fcarea_bot'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-button profile-telegram-link"
                  >
                    {t.profileTelegramOpenBtn}
                  </a>
                  <div className="profile-telegram-steps">
                    <p className="panel-hint profile-telegram-chat-only">{t.profileTelegramChatOnly}</p>
                    <p className="panel-hint profile-telegram-no-redirect">
                      {t.profileTelegramNoRedirect}{' '}
                      <strong className="profile-telegram-domain">{typeof window !== 'undefined' ? window.location.host : ''}</strong>
                    </p>
                    <p className="panel-hint profile-telegram-step2">{t.profileTelegramStep2}</p>
                    <p className="panel-hint profile-telegram-botfather">{t.profileTelegramBotfatherHint}</p>
                    <p className="panel-hint profile-telegram-setdomain">{t.profileTelegramSetDomain}</p>
                  </div>
                  <p className="panel-hint profile-telegram-hint">
                    {t.profileTelegramOrOpen}{' '}
                    <a
                      href={`https://t.me/${(import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string) || 'fcarea_bot'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{(import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string) || 'fcarea_bot'}
                    </a>
                  </p>
                </>
              )}
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

                {currentMatch.score_submitted_by == null && (
                  <>
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
                      onClick={submitLobbyScore}
                    >
                      {savingMatch ? '…' : t.ladderSubmitScore}
                    </button>
                  </>
                )}

                {currentMatch.score_submitted_by === playerId && (
                  <>
                    <p className="panel-text">
                      {t.ladderMyScore}: {currentMatch.player_a_id === playerId ? (currentMatch.score_a ?? 0) : (currentMatch.score_b ?? 0)} — {t.ladderOppScore}: {currentMatch.player_a_id === playerId ? (currentMatch.score_b ?? 0) : (currentMatch.score_a ?? 0)}
                    </p>
                    <p className="panel-text small">{t.ladderWaitingConfirm}</p>
                    {matchMessage && (
                      <p className="panel-success">{matchMessage}</p>
                    )}
                  </>
                )}

                {currentMatch.score_submitted_by === opponentId && (
                  <>
                    <p className="panel-text">
                      {t.ladderOpponentProposed.replace(
                        '{score}',
                        `${currentMatch.score_a ?? 0} – ${currentMatch.score_b ?? 0}`,
                      )}
                    </p>
                    {matchMessage && (
                      <p className={matchMessage === t.ladderResultConfirmed ? 'panel-success' : 'panel-error'}>
                        {matchMessage}
                      </p>
                    )}
                    <button
                      type="button"
                      className="primary-button"
                      disabled={savingMatch}
                      onClick={confirmLobbyResult}
                    >
                      {savingMatch ? '…' : t.ladderConfirmResult}
                    </button>
                  </>
                )}
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

      <footer className="site-footer">
        <span className="site-footer-brand">{t.appTitle}</span>
        <span className="site-footer-copy">Ladder &amp; Tournaments</span>
      </footer>
    </div>
  )
}

export default App
