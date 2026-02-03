import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

type View = 'home' | 'profile' | 'ladder' | 'tournaments' | 'matches' | 'rating' | 'admin'
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
    profileCalibrationLabel: string
    profileLoading: string
    profileTelegramTitle: string
    profileTelegramConnected: string
    profileTelegramUsername: string
    profileTelegramId: string
    profileTelegramNotConnected: string
    profileTelegramLoginLabel: string
    profileTelegramLoginButton: string
    profileTelegramSameTab: string
    profileTelegramSetDomainOne: string
    profileLogout: string
    profileDisplayName: string
    profileTelegramDataHint: string
    profileHint: string
    profileError: string
    profileErrorRlsHint: string
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
    ladderChatTitle: string
    ladderChatPlaceholder: string
    ladderChatSend: string
    ladderChatEmpty: string
    ladderChatLoadError: string
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
    ladderProfileLoading: string
    ladderProfileNotReady: string
    ladderTwoPlayersHint: string
    ladderActiveLobbyBanner: string
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
    navMatches: string
    navRating: string
    navAdmin: string
    matchesHeader: string
    matchesIntro: string
    matchesLoading: string
    matchesEmpty: string
    matchResultAWin: string
    matchResultBWin: string
    matchResultDraw: string
    ratingHeader: string
    ratingIntro: string
    ratingLoading: string
    ratingEmpty: string
    ratingRank: string
    ratingElo: string
    ratingMatches: string
    ratingWins: string
    ratingDraws: string
    ratingLosses: string
    ratingGoalsFor: string
    ratingGoalsAgainst: string
    ratingWinRate: string
    ratingBack: string
    homeHowTitle: string
    homeHowStep1: string
    homeHowStep2: string
    homeHowStep3: string
    homeStatusTitle: string
    playerProfileTitle: string
    profileRankLevel: string
    profileRankElite: string
    profileAvatar: string
    profileCountry: string
    profileSave: string
    profileAvatarUrlPlaceholder: string
    profileStatsSummary: string
    profileMatchesWins: string
    profileLast10Matches: string
    profileUploadAvatar: string
    profileResultWin: string
    profileResultLoss: string
    profileResultDraw: string
    profileRecentMatchesEmpty: string
    profileAvatarBucketHint: string
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
      matches: 'Matches',
      rating: 'Rating',
      admin: 'Admin',
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
    profileCalibrationLabel: 'Calibration: first 10 matches',
    profileLoading: 'Loading profile…',
    profileTelegramTitle: 'Telegram',
    profileTelegramConnected: 'Account linked to Telegram',
    profileTelegramUsername: 'Username',
    profileTelegramId: 'Telegram ID',
    profileTelegramNotConnected: 'Log in with Telegram to link your profile and see stats.',
    profileTelegramLoginLabel: 'Log in with Telegram:',
    profileTelegramLoginButton: 'Log in with Telegram',
    profileTelegramSameTab: 'After login you\'ll return here. If you still see Guest, add this domain in BotFather: /setdomain',
    profileTelegramSetDomainOne: 'If still Guest after login: in BotFather run /setdomain and add this domain:',
    profileLogout: 'Log out',
    profileDisplayName: 'Display name (nickname)',
    profileTelegramDataHint: 'Telegram data is stored for admin notifications.',
    profileHint:
      'Profile and rating are already stored in Supabase. Later we will add match history and advanced stats.',
    profileError: 'Failed to load profile. Check your connection and try again.',
    profileErrorRlsHint: 'If the error mentions RLS or policy: run the script supabase-rls-players-matches.sql in Supabase (SQL Editor).',
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
    ladderChatTitle: 'Chat with opponent',
    ladderChatPlaceholder: 'Message…',
    ladderChatSend: 'Send',
    ladderChatEmpty: 'No messages yet.',
    ladderChatLoadError: 'Could not load messages. Check that chat_messages table exists and RLS allows select.',
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
    ladderLoginRequired: 'Log in to play.',
    ladderProfileLoading: 'Loading profile…',
    ladderProfileNotReady: 'Profile not ready. Open the Profile tab and wait for it to load, or log in again.',
    ladderTwoPlayersHint: 'Two different players must press Search at the same time (e.g. two devices or two accounts).',
    ladderActiveLobbyBanner: 'You have an active lobby — return',
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
    navMatches: 'Matches',
    navRating: 'Rating',
    navAdmin: 'Admin',
    matchesHeader: 'All matches',
    matchesIntro: 'Recently played matches.',
    matchesLoading: 'Loading matches…',
    matchesEmpty: 'No matches yet.',
    matchResultAWin: 'Player A win',
    matchResultBWin: 'Player B win',
    matchResultDraw: 'Draw',
    ratingHeader: 'Player rating',
    ratingIntro: 'All players by ELO.',
    ratingLoading: 'Loading rating…',
    ratingEmpty: 'No players yet.',
    ratingRank: '#',
    ratingElo: 'ELO',
    ratingMatches: 'Matches',
    ratingWins: 'W',
    ratingDraws: 'D',
    ratingLosses: 'L',
    ratingGoalsFor: 'GF',
    ratingGoalsAgainst: 'GA',
    ratingWinRate: 'W%',
    ratingBack: 'Back to rating',
    homeHowTitle: 'How it works',
    homeHowStep1: 'Log in with Telegram and open Quick play.',
    homeHowStep2: 'Press Search, get a lobby and agree on the score with your opponent.',
    homeHowStep3: 'Confirm the result — your ELO and rank are updated instantly.',
    homeStatusTitle: 'Your current status',
    playerProfileTitle: 'Player profile',
    profileRankLevel: 'Level {n}',
    profileRankElite: 'Elite',
    profileAvatar: 'Avatar',
    profileCountry: 'Country',
    profileSave: 'Save profile',
    profileAvatarUrlPlaceholder: 'Avatar image URL',
    profileStatsSummary: 'Statistics',
    profileMatchesWins: 'matches, {pct}% wins',
    profileLast10Matches: 'Last 10 matches',
    profileUploadAvatar: 'Upload avatar',
    profileResultWin: 'Win',
    profileResultLoss: 'Loss',
    profileResultDraw: 'Draw',
    profileRecentMatchesEmpty: 'No matches yet.',
    profileAvatarBucketHint: 'Create the "avatars" bucket in Supabase Dashboard → Storage (public), then try again.',
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
      matches: 'Meciuri',
      rating: 'Clasament',
      admin: 'Admin',
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
    profileCalibrationLabel: 'Calibrare: primele 10 meciuri',
    profileLoading: 'Se încarcă profilul…',
    profileTelegramTitle: 'Telegram',
    profileTelegramConnected: 'Cont legat de Telegram',
    profileTelegramUsername: 'Username',
    profileTelegramId: 'ID Telegram',
    profileTelegramNotConnected: 'Autentifică-te cu Telegram pentru a lega profilul și a vedea statisticile.',
    profileTelegramLoginLabel: 'Autentificare cu Telegram:',
    profileTelegramLoginButton: 'Autentificare cu Telegram',
    profileTelegramSameTab: 'După login vei reveni aici. Dacă tot vezi „oaspete”, adaugă domeniul în BotFather: /setdomain',
    profileTelegramSetDomainOne: 'Dacă tot vezi „oaspete” după login: în BotFather rulează /setdomain și adaugă domeniul:',
    profileLogout: 'Deconectare',
    profileDisplayName: 'Nume afișat (poreclă)',
    profileTelegramDataHint: 'Datele Telegram sunt stocate pentru notificări de la admin.',
    profileHint:
      'Profilul și ratingul sunt deja stocate în Supabase. Mai târziu vom adăuga istoric și statistici avansate.',
    profileError: 'Profilul nu s-a putut încărca. Verifică conexiunea și încearcă din nou.',
    profileErrorRlsHint: 'Dacă eroarea menționează RLS sau policy: rulează scriptul supabase-rls-players-matches.sql în Supabase (SQL Editor).',
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
    ladderChatTitle: 'Chat cu adversarul',
    ladderChatPlaceholder: 'Mesaj…',
    ladderChatSend: 'Trimite',
    ladderChatEmpty: 'Niciun mesaj încă.',
    ladderChatLoadError: 'Nu s-au putut încărca mesajele. Verifică tabelul chat_messages și RLS.',
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
    ladderLoginRequired: 'Autentifică-te pentru a juca.',
    ladderProfileLoading: 'Se încarcă profilul…',
    ladderProfileNotReady: 'Profilul nu e gata. Deschide tab-ul Profil și așteaptă încărcarea sau autentifică-te din nou.',
    ladderTwoPlayersHint: 'Doi jucători diferiți trebuie să apese Caută în același timp (ex. două dispozitive sau două conturi).',
    ladderActiveLobbyBanner: 'Ai un lobby activ — întoarce-te',
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
    navMatches: 'Meciuri',
    navRating: 'Clasament',
    navAdmin: 'Admin',
    matchesHeader: 'Toate meciurile',
    matchesIntro: 'Meciuri jucate recent.',
    matchesLoading: 'Se încarcă meciurile…',
    matchesEmpty: 'Niciun meci încă.',
    matchResultAWin: 'Victorie jucător A',
    matchResultBWin: 'Victorie jucător B',
    matchResultDraw: 'Remiză',
    ratingHeader: 'Clasament jucători',
    ratingIntro: 'Toți jucătorii după ELO.',
    ratingLoading: 'Se încarcă clasamentul…',
    ratingEmpty: 'Niciun jucător încă.',
    ratingRank: '#',
    ratingElo: 'ELO',
    ratingMatches: 'Meciuri',
    ratingWins: 'V',
    ratingDraws: 'E',
    ratingLosses: 'Înf',
    ratingGoalsFor: 'GM',
    ratingGoalsAgainst: 'GP',
    ratingWinRate: 'V%',
    ratingBack: 'Înapoi la clasament',
    homeHowTitle: 'Cum funcționează',
    homeHowStep1: 'Autentifică-te cu Telegram și deschide Joc rapid.',
    homeHowStep2: 'Apasă Caută, intră în lobby și pune de acord scorul cu adversarul.',
    homeHowStep3: 'Confirmă rezultatul — ELO și nivelul tău se actualizează instant.',
    homeStatusTitle: 'Statusul tău curent',
    playerProfileTitle: 'Profil jucător',
    profileRankLevel: 'Nivel {n}',
    profileRankElite: 'Elită',
    profileAvatar: 'Avatar',
    profileCountry: 'Țara',
    profileSave: 'Salvează profilul',
    profileAvatarUrlPlaceholder: 'URL imagine avatar',
    profileStatsSummary: 'Statistici',
    profileMatchesWins: 'meciuri, {pct}% victorii',
    profileLast10Matches: 'Ultimele 10 meciuri',
    profileUploadAvatar: 'Încarcă avatar',
    profileResultWin: 'Victorie',
    profileResultLoss: 'Înfrângere',
    profileResultDraw: 'Remiză',
    profileRecentMatchesEmpty: 'Niciun meci încă.',
    profileAvatarBucketHint: 'Creează buclea "avatars" în Supabase Dashboard → Storage (public), apoi încearcă din nou.',
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
      matches: 'Матчи',
      rating: 'Рейтинг',
      admin: 'Админка',
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
    profileCalibrationLabel: 'Калибровка рейтинга: первые 10 матчей',
    profileLoading: 'Загружаем профиль…',
    profileTelegramTitle: 'Telegram',
    profileTelegramConnected: 'Аккаунт привязан к Telegram',
    profileTelegramUsername: 'Username',
    profileTelegramId: 'ID в Telegram',
    profileTelegramNotConnected: 'Войдите через Telegram, чтобы привязать профиль и видеть статистику.',
    profileTelegramLoginLabel: 'Вход через Telegram:',
    profileTelegramLoginButton: 'Войти через Telegram',
    profileTelegramSameTab: 'После входа вы вернётесь сюда. Если всё ещё «Гость» — добавьте этот домен в BotFather: /setdomain',
    profileTelegramSetDomainOne: 'Если после входа всё ещё «Гость»: в BotFather выполните /setdomain и добавьте домен:',
    profileLogout: 'Выйти',
    profileDisplayName: 'Отображаемое имя (никнейм)',
    profileTelegramDataHint: 'Данные Telegram сохраняются для уведомлений от администрации.',
    profileHint:
      'Профиль и рейтинг уже хранятся в Supabase. Позже добавим историю матчей и расширенную статистику.',
    profileError: 'Не удалось загрузить профиль. Проверьте подключение и попробуйте снова.',
    profileErrorRlsHint: 'Если в ошибке упоминается RLS или policy: выполните в Supabase (SQL Editor) скрипт supabase-rls-players-matches.sql.',
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
    ladderChatTitle: 'Чат с соперником',
    ladderChatPlaceholder: 'Сообщение…',
    ladderChatSend: 'Отправить',
    ladderChatEmpty: 'Пока нет сообщений.',
    ladderChatLoadError: 'Не удалось загрузить сообщения. Проверьте таблицу chat_messages и RLS.',
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
    ladderLoginRequired: 'Войдите, чтобы играть.',
    ladderProfileLoading: 'Загрузка профиля…',
    ladderProfileNotReady: 'Профиль не загружен. Откройте вкладку «Профиль» и дождитесь загрузки или войдите снова.',
    ladderTwoPlayersHint: 'Два разных игрока должны нажать «Поиск» одновременно (например, с двух устройств или двух аккаунтов).',
    ladderActiveLobbyBanner: 'У вас активное лобби — вернуться',
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
    navMatches: 'Матчи',
    navRating: 'Рейтинг',
    navAdmin: 'Админ',
    matchesHeader: 'Все матчи',
    matchesIntro: 'Недавно сыгранные матчи.',
    matchesLoading: 'Загрузка матчей…',
    matchesEmpty: 'Матчей пока нет.',
    matchResultAWin: 'Победа игрока A',
    matchResultBWin: 'Победа игрока B',
    matchResultDraw: 'Ничья',
    ratingHeader: 'Рейтинг игроков',
    ratingIntro: 'Все игроки по ELO.',
    ratingLoading: 'Загрузка рейтинга…',
    ratingEmpty: 'Игроков пока нет.',
    ratingRank: '#',
    ratingElo: 'ELO',
    ratingMatches: 'Матчей',
    ratingWins: 'П',
    ratingDraws: 'Н',
    ratingLosses: 'ПР',
    ratingGoalsFor: 'ГЗ',
    ratingGoalsAgainst: 'ГП',
    ratingWinRate: 'Винрейт %',
    ratingBack: 'Назад к рейтингу',
    homeHowTitle: 'Как это работает',
    homeHowStep1: 'Войдите через Telegram и откройте раздел «Быстрая игра».',
    homeHowStep2: 'Нажмите «Искать соперника», попадите в лобби и договоритесь о счёте.',
    homeHowStep3: 'Подтвердите результат — ваш ELO и ранг обновятся сразу.',
    homeStatusTitle: 'Ваш текущий статус',
    playerProfileTitle: 'Профиль игрока',
    profileRankLevel: 'Уровень {n}',
    profileRankElite: 'Элита',
    profileAvatar: 'Аватар',
    profileCountry: 'Страна',
    profileSave: 'Сохранить профиль',
    profileAvatarUrlPlaceholder: 'URL изображения аватара',
    profileStatsSummary: 'Статистика',
    profileMatchesWins: 'матчей, {pct}% побед',
    profileLast10Matches: 'Последние 10 матчей',
    profileUploadAvatar: 'Загрузить аватар',
    profileResultWin: 'Победа',
    profileResultLoss: 'Поражение',
    profileResultDraw: 'Ничья',
    profileRecentMatchesEmpty: 'Матчей пока нет.',
    profileAvatarBucketHint: 'Создайте бакет "avatars" в Supabase Dashboard → Storage (public), затем попробуйте снова.',
    guestName: 'Гость',
  },
}

const WIDGET_USER_KEY = 'fc_area_telegram_user'

const COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: 'OTHER', name: 'Other', flag: '🌐' },
]

type TelegramUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

const TG_REDIRECT_KEY = 'tg_redirect'

/** Парсит данные пользователя после редиректа из Telegram. Не удаляет из sessionStorage — очистка в useEffect. */
function parseWidgetRedirect(): TelegramUser | null {
  const hash = window.location.hash?.slice(1)
  const search = window.location.search?.slice(1)
  let saved: string | null = null
  try {
    saved = sessionStorage.getItem(TG_REDIRECT_KEY)
  } catch (_) {}
  const paramsStr = (hash || search || saved || '').trim()
  if (!paramsStr) return null
  const params = new URLSearchParams(paramsStr)

  // Формат Mini App / OAuth: tgAuthResult=<base64_json>
  const tgAuthResult = params.get('tgAuthResult')
  if (tgAuthResult) {
    try {
      const jsonStr = atob(tgAuthResult)
      // Если tgAuthResult=false, значит авторизация не прошла
      if (jsonStr === 'false') return null
      const data = JSON.parse(jsonStr) as {
        id?: number
        first_name?: string
        last_name?: string
        username?: string
      }
      if (typeof data.id === 'number' && typeof data.first_name === 'string') {
        return {
          id: data.id,
          first_name: data.first_name.trim(),
          last_name: data.last_name?.trim() || undefined,
          username: data.username?.trim() || undefined,
        }
      }
    } catch (_) {
      // невалидный base64/JSON — fallback к обычным параметрам
    }
  }

  const id = params.get('id') || params.get('user_id')
  const first_name = params.get('first_name')
  if (!id || !first_name) return null
  const numId = parseInt(id, 10)
  if (Number.isNaN(numId)) return null
  return {
    id: numId,
    first_name: first_name.trim(),
    last_name: params.get('last_name')?.trim() || undefined,
    username: params.get('username')?.trim() || undefined,
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

/** Короткий звуковой сигнал при нахождении лобби (Web Audio, без внешних файлов). */
function playLobbyFoundSound() {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    // тихо игнорируем, если браузер блокирует звук
  }
}

/** Показывает нативное уведомление браузера, если вкладка не активна. */
function showLobbyNotification(title: string, body: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (!('Notification' in window)) return
  // Запрашиваем разрешение только при необходимости
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted' && document.hidden) {
        new Notification(title, { body })
      }
    })
    return
  }
  if (Notification.permission === 'granted' && document.hidden) {
    new Notification(title, { body })
  }
}

/** Ранг по ELO: Level 1 (1–800) … Level 9 (1851–2000), Level 10 = Elite (2001+). */
function getRankFromElo(elo: number | null): { level: number; isElite: boolean } | null {
  if (elo == null || elo < 1) return null
  if (elo >= 2001) return { level: 10, isElite: true }
  if (elo <= 800) return { level: 1, isElite: false }
  if (elo <= 950) return { level: 2, isElite: false }
  if (elo <= 1100) return { level: 3, isElite: false }
  if (elo <= 1250) return { level: 4, isElite: false }
  if (elo <= 1400) return { level: 5, isElite: false }
  if (elo <= 1550) return { level: 6, isElite: false }
  if (elo <= 1700) return { level: 7, isElite: false }
  if (elo <= 1850) return { level: 8, isElite: false }
  return { level: 9, isElite: false }
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
  const [searchStartedAt, setSearchStartedAt] = useState<number | null>(null)
  const [searchElapsed, setSearchElapsed] = useState(0)
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
  type ChatMessageRow = { id: number; match_id: number; sender_id: string; body: string; created_at: string }
  const [chatMessages, setChatMessages] = useState<ChatMessageRow[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatLoadError, setChatLoadError] = useState<string | null>(null)
  const [allMatches, setAllMatches] = useState<Array<{ match_id: number; player_a_name: string; player_b_name: string; score_a: number; score_b: number; result: string; played_at: string | null; elo_delta_a: number | null; elo_delta_b: number | null }>>([])
  const [allMatchesLoading, setAllMatchesLoading] = useState(false)
  type LeaderboardRow = {
    rank: number
    player_id: string
    display_name: string | null
    avatar_url?: string | null
    country_code?: string | null
    elo: number | null
    matches_count: number
    wins: number
    draws: number
    losses: number
    goals_for: number
    goals_against: number
    win_rate: number | null
  }
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [selectedPlayerRow, setSelectedPlayerRow] = useState<LeaderboardRow | null>(null)
  const [profileFromHashLoading, setProfileFromHashLoading] = useState(false)
  const [myAvatarUrl, setMyAvatarUrl] = useState<string>('')
  const [myCountryCode, setMyCountryCode] = useState<string>('')
  const [myDisplayName, setMyDisplayName] = useState<string>('')
  const [profileSaveLoading, setProfileSaveLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null)
  type RecentMatchRow = { match_id: number; opponent_name: string | null; my_score: number; opp_score: number; result: string; played_at: string | null; elo_delta?: number | null }
  const [recentMatches, setRecentMatches] = useState<RecentMatchRow[]>([])
  const [recentMatchesLoading, setRecentMatchesLoading] = useState(false)
  const [myProfileStats, setMyProfileStats] = useState<LeaderboardRow | null>(null)
  const [myRecentMatches, setMyRecentMatches] = useState<RecentMatchRow[]>([])
  const [myProfileStatsLoading, setMyProfileStatsLoading] = useState(false)
  const lastLobbyMatchIdRef = useRef<number | null>(null)
  const widgetContainerRef = useRef<HTMLDivElement>(null)
  const chatMessagesScrollRef = useRef<HTMLDivElement>(null)
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)

  // Парсим редирект один раз при загрузке (до первого рендера)
  const parsedRedirectRef = useRef<TelegramUser | null>(null)
  if (parsedRedirectRef.current === null) {
    const parsed = parseWidgetRedirect()
    if (parsed) {
      try {
        localStorage.setItem(WIDGET_USER_KEY, JSON.stringify(parsed))
      } catch (_) {}
      parsedRedirectRef.current = parsed
    }
  }

  const [widgetUser, setWidgetUser] = useState<TelegramUser | null>(() => {
    return parsedRedirectRef.current || getStoredWidgetUser()
  })

  // Если был редирект из Telegram — очищаем URL и переключаемся на профиль
  useEffect(() => {
    if (parsedRedirectRef.current) {
      setWidgetUser(parsedRedirectRef.current)
      setActiveView('profile')
      try {
        sessionStorage.removeItem(TG_REDIRECT_KEY)
      } catch (_) {}
      window.history.replaceState(null, '', window.location.pathname)
      parsedRedirectRef.current = null
    }
  }, [])

  // Прямая ссылка на вход через Telegram (fallback, если виджет не загружается). Bot ID — из токена BotFather (часть до двоеточия).
  const telegramBotId = import.meta.env.VITE_TELEGRAM_BOT_ID as string | undefined
  const telegramLoginUrl = useMemo(() => {
    if (!telegramBotId?.trim()) return null
    const origin = (import.meta.env.VITE_APP_URL as string) || (typeof window !== 'undefined' ? window.location.origin : '')
    if (!origin) return null
    return `https://oauth.telegram.org/auth?bot_id=${encodeURIComponent(telegramBotId.trim())}&origin=${encodeURIComponent(origin)}&request_access=write`
  }, [telegramBotId])

  const showWidget = !widgetUser && activeView === 'profile' && !telegramLoginUrl
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

  const user = widgetUser

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
  const isAdminUser = user?.username?.toLowerCase() === 'belovolk1'
  const [adminMessage, setAdminMessage] = useState('')
  const [adminMinElo, setAdminMinElo] = useState('')
  const [adminTargetUsername, setAdminTargetUsername] = useState('')
  const [adminSending, setAdminSending] = useState(false)
  const [adminResult, setAdminResult] = useState<string | null>(null)

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
      const u = upserted as { avatar_url?: string | null; country_code?: string | null; display_name?: string | null }
      setMyAvatarUrl(u?.avatar_url ?? '')
      setMyCountryCode(u?.country_code ?? '')
      setMyDisplayName(u?.display_name ?? '')

      // считаем подтверждённые матчи через RPC (UUID в теле — без 400)
      const { data: count, error: countErr } = await supabase.rpc('get_my_matches_count', { p_player_id: upserted.id })
      if (!countErr && count != null) setMatchesCount(Number(count))

      setLoadingProfile(false)
    }

    void loadProfile()
  }, [user])

  // Полная статистика своего профиля для единого макета (как у чужого)
  useEffect(() => {
    if (activeView !== 'profile' || !playerId) {
      setMyProfileStats(null)
      setMyRecentMatches([])
      return
    }
    setMyProfileStatsLoading(true)
    Promise.all([
      supabase.rpc('get_player_profile', { p_player_id: playerId }),
      supabase.rpc('get_player_recent_matches', { p_player_id: playerId }),
    ]).then(([profileRes, recentRes]) => {
      setMyProfileStatsLoading(false)
      if (!profileRes.error && Array.isArray(profileRes.data) && profileRes.data[0]) {
        setMyProfileStats(profileRes.data[0] as LeaderboardRow)
      } else {
        setMyProfileStats(null)
      }
      if (!recentRes.error && Array.isArray(recentRes.data)) {
        setMyRecentMatches(recentRes.data as RecentMatchRow[])
      } else {
        setMyRecentMatches([])
      }
    })
  }, [activeView, playerId])

  const displayName = useMemo(() => {
    if (!user) return t.guestName
    if (myDisplayName.trim()) return myDisplayName.trim()
    if (user.username) return `@${user.username}`
    return [user.first_name, user.last_name].filter(Boolean).join(' ') || t.guestName
  }, [t.guestName, user, myDisplayName])

  const refetchMatchesCount = async () => {
    if (!playerId) return
    const { data: count, error } = await supabase.rpc('get_my_matches_count', { p_player_id: playerId })
    if (!error && count != null) setMatchesCount(Number(count))
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
        if (!searchStartedAt) {
          setSearchStartedAt(Date.now())
          setSearchElapsed(0)
        }
        return
      }
      const { data: pendingRows, error: pendingErr } = await supabase.rpc('get_my_pending_match', { p_player_id: playerId })
      const pending = Array.isArray(pendingRows) ? pendingRows[0] : pendingRows
      if (!pendingErr && pending) {
        void supabase.from('matchmaking_queue').delete().eq('player_id', playerId)
        setCurrentMatch({
          id: pending.id,
          player_a_id: pending.player_a_id,
          player_b_id: pending.player_b_id,
          score_a: pending.score_a ?? undefined,
          score_b: pending.score_b ?? undefined,
          score_submitted_by: pending.score_submitted_by ?? undefined,
        })
        const oppId = pending.player_a_id === playerId ? pending.player_b_id : pending.player_a_id
        const { data: opp } = await supabase.from('players').select('display_name, username, first_name, last_name').eq('id', oppId).single()
        const name = opp
          ? (opp.display_name?.trim() || (opp.username ? `@${opp.username}` : null) || [opp.first_name, opp.last_name].filter(Boolean).join(' ') || t.guestName)
          : t.guestName
        setOpponentName(name)
        setSearchStatus('in_lobby')
        setSearchStartedAt(null)
        setSearchElapsed(0)
      }
    }
    void check()
  }, [activeView, playerId, t.guestName])

  // Применить найденный матч (лобби) — общий код для Realtime и опроса.
  // Сразу удаляем себя из очереди поиска, чтобы не участвовать в матчмейкинге, пока снова не нажмём «Поиск».
  const applyPendingMatch = async (match: { id: number; player_a_id: string; player_b_id: string; score_a?: number | null; score_b?: number | null; score_submitted_by?: string | null }) => {
    if (playerId) void supabase.from('matchmaking_queue').delete().eq('player_id', playerId)
    setCurrentMatch({
      id: match.id,
      player_a_id: match.player_a_id,
      player_b_id: match.player_b_id,
      score_a: match.score_a ?? undefined,
      score_b: match.score_b ?? undefined,
      score_submitted_by: match.score_submitted_by ?? undefined,
    })
    const oppId = match.player_a_id === playerId ? match.player_b_id : match.player_a_id
    const { data: opp } = await supabase.from('players').select('display_name, username, first_name, last_name').eq('id', oppId).single()
    const name = opp
      ? (opp.display_name?.trim() || (opp.username ? `@${opp.username}` : null) || [opp.first_name, opp.last_name].filter(Boolean).join(' ') || t.guestName)
      : t.guestName
    setOpponentName(name)
    setSearchStatus('in_lobby')
    setSearchStartedAt(null)
    setSearchElapsed(0)
  }

  const fetchPendingMatch = async (): Promise<boolean> => {
    if (!playerId) return false
    const { data: rows, error } = await supabase.rpc('get_my_pending_match', { p_player_id: playerId })
    const data = Array.isArray(rows) ? rows[0] : rows
    if (!error && data) {
      await applyPendingMatch(data)
      return true
    }
    return false
  }

  // Realtime: подписка на новые матчи (мгновенный переход в лобби)
  useEffect(() => {
    if (searchStatus !== 'searching' || !playerId) return
    const channel = supabase
      .channel('matchmaking-matches')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches', filter: `player_a_id=eq."${playerId}"` },
        async (payload) => {
          const row = payload.new as { id: number; player_a_id: string; player_b_id: string; result?: string; score_a?: number | null; score_b?: number | null; score_submitted_by?: string | null }
          if (row.result === 'PENDING') await applyPendingMatch(row)
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches', filter: `player_b_id=eq."${playerId}"` },
        async (payload) => {
          const row = payload.new as { id: number; player_a_id: string; player_b_id: string; result?: string; score_a?: number | null; score_b?: number | null; score_submitted_by?: string | null }
          if (row.result === 'PENDING') await applyPendingMatch(row)
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('[FC Area] Realtime: subscribed to matches')
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [searchStatus, playerId])

  // Realtime: обновление матча (соперник ввёл счёт) — второй игрок сразу видит предложенный счёт и кнопку «Подтвердить»
  useEffect(() => {
    if (searchStatus !== 'in_lobby' || !currentMatch?.id) return
    const matchId = currentMatch.id
    const channel = supabase
      .channel(`match-update-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as { id: number; result?: string; player_a_id: string; player_b_id: string; score_a?: number | null; score_b?: number | null; score_submitted_by?: string | null }
          if (row.result && row.result !== 'PENDING') {
            setMatchMessage(t.ladderResultConfirmed)
            setCurrentMatch(null)
            setOpponentName('')
            setSearchStatus('idle')
            setSearchStartedAt(null)
            setSearchElapsed(0)
            refetchMatchesCount()
            return
          }
          setCurrentMatch((prev) =>
            prev && prev.id === row.id
              ? {
                  ...prev,
                  score_a: row.score_a ?? undefined,
                  score_b: row.score_b ?? undefined,
                  score_submitted_by: row.score_submitted_by ?? undefined,
                }
              : prev,
          )
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('[FC Area] Realtime: subscribed to match update', matchId)
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [searchStatus, currentMatch?.id, t])

  // Опрос (fallback) в лобби: обновляем данные матча (счёт, score_submitted_by) или закрываем лобби, если соперник подтвердил
  useEffect(() => {
    if (searchStatus !== 'in_lobby' || !playerId || !currentMatch?.id) return
    const matchId = currentMatch.id
    const interval = setInterval(async () => {
      const { data: rows, error } = await supabase.rpc('get_my_pending_match', { p_player_id: playerId })
      const data = Array.isArray(rows) ? rows[0] : rows
      if (!error && !data) {
        setMatchMessage(t.ladderResultConfirmed)
        setCurrentMatch(null)
        setOpponentName('')
        setSearchStatus('idle')
        setSearchStartedAt(null)
        setSearchElapsed(0)
        refetchMatchesCount()
        return
      }
      if (!error && data && (data as { id: number }).id === matchId) {
        setCurrentMatch((prev) =>
          prev
            ? {
                ...prev,
                score_a: (data as { score_a?: number | null }).score_a ?? undefined,
                score_b: (data as { score_b?: number | null }).score_b ?? undefined,
                score_submitted_by: (data as { score_submitted_by?: string | null }).score_submitted_by ?? undefined,
              }
            : prev,
        )
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [searchStatus, playerId, currentMatch?.id])

  // Чат матча: загрузка сообщений и подписка на новые (уникальный чат только для двух соперников)
  useEffect(() => {
    if (searchStatus !== 'in_lobby' || !currentMatch?.id) {
      setChatMessages([])
      setChatLoadError(null)
      return
    }
    const matchId = currentMatch.id
    setChatLoadError(null)
    const loadChat = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, match_id, sender_id, body, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
      if (error) {
        console.error('[FC Area] chat_messages load error:', error)
        setChatLoadError(error.message || t.ladderChatLoadError)
        setChatMessages([])
        return
      }
      setChatLoadError(null)
      setChatMessages((Array.isArray(data) ? data : []) as ChatMessageRow[])
    }
    void loadChat()
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as ChatMessageRow
          setChatMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [searchStatus, currentMatch?.id, t])

  // Автоскролл чата к последнему сообщению
  useLayoutEffect(() => {
    if (searchStatus !== 'in_lobby' || !chatMessages.length) return
    const container = chatMessagesScrollRef.current
    if (!container) return
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
  }, [searchStatus, chatMessages.length, chatMessages])

  // Таймер поиска: сколько длится поиск соперника
  useEffect(() => {
    if (searchStatus !== 'searching' || !searchStartedAt) {
      setSearchElapsed(0)
      return
    }
    const update = () => {
      setSearchElapsed(Math.max(0, Math.floor((Date.now() - searchStartedAt) / 1000)))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [searchStatus, searchStartedAt])

  const handleAdminSend = async () => {
    const text = adminMessage.trim()
    if (!isAdminUser || !text) return
    const endpoint = import.meta.env.VITE_ADMIN_BROADCAST_URL as string | undefined
    const token = import.meta.env.VITE_ADMIN_BROADCAST_TOKEN as string | undefined
    if (!endpoint || !token) {
      setAdminResult(`Не настроен VITE_ADMIN_BROADCAST_URL или VITE_ADMIN_BROADCAST_TOKEN. URL: ${endpoint ? '✓' : '✗'}, Token: ${token ? '✓' : '✗'}`)
      return
    }
    setAdminSending(true)
    setAdminResult(null)
    try {
      const payload: any = {
        mode: adminTargetUsername.trim() ? 'single' : 'broadcast',
        message: text,
      }
      if (adminMinElo.trim()) payload.minElo = Number(adminMinElo)
      if (adminTargetUsername.trim()) payload.targetUsername = adminTargetUsername.trim()

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
        },
        body: JSON.stringify(payload),
      })
      if (!resp.ok) {
        const txt = await resp.text()
        setAdminResult(`Ошибка отправки: ${resp.status} ${txt}`)
      } else {
        const data = await resp.json().catch(() => ({}))
        if (payload.mode === 'single') {
          setAdminResult('Сообщение одному пользователю отправлено (проверь логи бота при ошибках).')
        } else {
          setAdminResult(`Рассылка завершена: отправлено ${data.sent ?? '?'} , ошибок ${data.failed ?? '?'}.`)
        }
        setAdminMessage('')
      }
    } catch (e: any) {
      setAdminResult(`Ошибка сети: ${String(e?.message || e)}`)
    } finally {
      setAdminSending(false)
    }
  }

  // Метка robots noindex для админки
  useEffect(() => {
    if (typeof document === 'undefined') return
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'robots'
      document.head.appendChild(meta)
    }
    if (activeView === 'admin') {
      meta.content = 'noindex, nofollow'
    } else if (meta.content === 'noindex, nofollow') {
      meta.content = 'index, follow'
    }
  }, [activeView])

  // Звук и браузерное уведомление при переходе в лобби (включая, когда вкладка неактивна)
  useEffect(() => {
    if (searchStatus !== 'in_lobby' || !currentMatch) return
    if (lastLobbyMatchIdRef.current === currentMatch.id) return
    lastLobbyMatchIdRef.current = currentMatch.id
    // звук всегда, после того как пользователь уже нажимал «Поиск»
    playLobbyFoundSound()
    // нативное уведомление, если пользователь в другой вкладке/приложении
    const title = messages[lang].ladderLobbyTitle
    const body = messages[lang].ladderLobbyVs.replace('{name}', opponentName || messages[lang].guestName)
    showLobbyNotification(title, body)
  }, [searchStatus, currentMatch?.id, lang, opponentName])

  // Опрос (fallback): когда в поиске — раз в 1 сек проверяем матч (если Realtime не сработал)
  useEffect(() => {
    if (searchStatus !== 'searching' || !playerId) return
    const interval = setInterval(() => {
      void fetchPendingMatch()
    }, 1000)
    return () => clearInterval(interval)
  }, [searchStatus, playerId])

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
      console.error('[FC Area] matchmaking_queue upsert failed:', error)
      setMatchMessage(t.ladderError + ' ' + (error.message || ''))
      return
    }
    setSearchStartedAt(Date.now())
    setSearchElapsed(0)
    setSearchStatus('searching')
  }

  const cancelSearch = async () => {
    if (!playerId) return
    await supabase.from('matchmaking_queue').delete().eq('player_id', playerId)
    setSearchStatus('idle')
    setSearchStartedAt(null)
    setSearchElapsed(0)
  }

  // Загрузка всех матчей при открытии страницы «Матчи»
  useEffect(() => {
    if (activeView !== 'matches') return
    setAllMatchesLoading(true)
    supabase.rpc('get_all_played_matches').then(({ data, error }) => {
      setAllMatchesLoading(false)
      if (!error && Array.isArray(data)) setAllMatches(data)
      else setAllMatches([])
    })
  }, [activeView])

  // При загрузке с #player=uuid — открыть рейтинг и показать профиль игрока в той же вкладке
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const m = hash.match(/player=([a-f0-9-]{36})/i)
    if (!m) return
    const uuid = m[1]
    setActiveView('rating')
    setProfileFromHashLoading(true)
    supabase.rpc('get_player_profile', { p_player_id: uuid }).then(({ data, error }) => {
      setProfileFromHashLoading(false)
      if (!error && Array.isArray(data) && data.length > 0) setSelectedPlayerRow(data[0] as LeaderboardRow)
      else setSelectedPlayerRow(null)
    })
  }, [])

  // Последние 10 матчей при открытии профиля игрока (из рейтинга)
  useEffect(() => {
    if (!selectedPlayerRow?.player_id) {
      setRecentMatches([])
      return
    }
    setRecentMatchesLoading(true)
    supabase.rpc('get_player_recent_matches', { p_player_id: selectedPlayerRow.player_id }).then(({ data, error }) => {
      setRecentMatchesLoading(false)
      if (!error && Array.isArray(data)) setRecentMatches(data as RecentMatchRow[])
      else setRecentMatches([])
    })
  }, [selectedPlayerRow?.player_id])

  // Загрузка рейтинга при открытии страницы «Рейтинг»
  useEffect(() => {
    if (activeView !== 'rating') return
    if (!window.location.hash.includes('player=')) setSelectedPlayerRow(null)
    setLeaderboardLoading(true)
    supabase.rpc('get_leaderboard').then(({ data, error }) => {
      setLeaderboardLoading(false)
      if (!error && Array.isArray(data)) setLeaderboard(data as LeaderboardRow[])
      else setLeaderboard([])
    })
  }, [activeView])

  const saveProfileAvatarCountry = async () => {
    if (!playerId) return
    setProfileSaveLoading(true)
    const { error } = await supabase
      .from('players')
      .update({
        display_name: myDisplayName.trim() || null,
        avatar_url: myAvatarUrl.trim() || null,
        country_code: myCountryCode || null,
      })
      .eq('id', playerId)
    setProfileSaveLoading(false)
    if (error) console.error('Failed to save profile', error)
  }

  const AVATAR_BUCKET = 'avatars'
  const uploadAvatar = async (file: File) => {
    if (!playerId || !file.type.startsWith('image/')) return
    setAvatarUploading(true)
    setAvatarUploadError(null)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${playerId}/avatar.${ext}`
    const { error: uploadErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: true })
    if (uploadErr) {
      const isBucketNotFound = uploadErr.message?.toLowerCase().includes('bucket not found') || uploadErr.message?.toLowerCase().includes('not found')
      setAvatarUploadError(isBucketNotFound ? t.profileAvatarBucketHint : uploadErr.message || t.ladderError)
      setAvatarUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    const publicUrl = urlData.publicUrl
    const { error: updateErr } = await supabase.from('players').update({ avatar_url: publicUrl }).eq('id', playerId)
    if (!updateErr) setMyAvatarUrl(publicUrl)
    setAvatarUploading(false)
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
    const { data: rpcError, error } = await supabase.rpc('submit_match_score', {
      p_match_id: String(currentMatch.id),
      p_player_id: playerId,
      p_score_a: scoreAVal,
      p_score_b: scoreBVal,
    })

    setSavingMatch(false)
    if (error) {
      console.error('[FC Area] submit_match_score error:', error)
      setMatchMessage(t.ladderError + (error.message ? ` ${error.message}` : ''))
      return
    }
    if (rpcError && typeof rpcError === 'string') {
      console.error('[FC Area] submit_match_score RPC returned:', rpcError)
      setMatchMessage(t.ladderError + ` ${rpcError}`)
      return
    }
    setMatchMessage(t.ladderSaved)
    setCurrentMatch((m) =>
      m ? { ...m, score_a: scoreAVal, score_b: scoreBVal, score_submitted_by: playerId } : m,
    )
  }

  const confirmLobbyResult = async () => {
    if (!currentMatch || !playerId) return

    setSavingMatch(true)
    setMatchMessage(null)
    const { data: msg, error } = await supabase.rpc('confirm_match_result', {
      p_match_id: String(currentMatch.id),
      p_player_id: playerId,
    })

    setSavingMatch(false)
    if (error) {
      setMatchMessage(t.ladderError + (error.message ? ' ' + error.message : ''))
      return
    }
    if (msg && typeof msg === 'string') {
      setMatchMessage(msg)
      return
    }
    setMatchMessage(t.ladderResultConfirmed)
    setScoreA('')
    setScoreB('')
    setCurrentMatch(null)
    setSearchStatus('idle')
    setSearchStartedAt(null)
    setSearchElapsed(0)
    refetchMatchesCount()
  }

  const sendChatMessage = async () => {
    const text = chatInput.trim()
    if (!text || !currentMatch?.id || !playerId || chatSending) return
    setChatSending(true)
    const { data: inserted, error } = await supabase
      .from('chat_messages')
      .insert({
        match_id: currentMatch.id,
        sender_id: playerId,
        body: text,
      })
      .select('id, match_id, sender_id, body, created_at')
      .single()
    setChatSending(false)
    if (!error && inserted) {
      setChatInput('')
      setChatMessages((prev) => (prev.some((m) => m.id === (inserted as ChatMessageRow).id) ? prev : [...prev, inserted as ChatMessageRow]))
    }
  }

  const [isWideScreen, setIsWideScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
  )
  const [navOpen, setNavOpen] = useState(false)
  useEffect(() => {
    const onResize = () => setIsWideScreen(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const showHamburger = !isWideScreen
  const useMobileLayout = !isWideScreen

  const closeNavAnd = (view: View) => {
    setActiveView(view)
    setNavOpen(false)
  }

  const navLinks: { view: View; label: string }[] = [
    { view: 'home', label: t.navHome },
    { view: 'ladder', label: t.navPlay },
    { view: 'tournaments', label: t.navTournaments },
    { view: 'matches', label: t.navMatches },
    { view: 'rating', label: t.navRating },
    { view: 'profile', label: t.navProfile },
    ...(isAdminUser ? [{ view: 'admin' as View, label: t.navAdmin }] : []),
  ]

  return (
    <div className={`app ${useMobileLayout ? 'app--mobile' : 'app--desktop'}`}>
      <div className="site-header">
        <header className="app-header">
          <div className="app-header-main">
            <h1 className="app-title">{t.appTitle}</h1>
            <p className="app-subtitle">{t.appSubtitle}</p>
          </div>
        </header>
        {showHamburger ? (
          <>
            <button
              type="button"
              className="nav-hamburger-btn"
              onClick={() => setNavOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={navOpen}
            >
              <span className={`nav-hamburger-line ${navOpen ? 'nav-hamburger-line--open' : ''}`} />
              <span className={`nav-hamburger-line ${navOpen ? 'nav-hamburger-line--open' : ''}`} />
              <span className={`nav-hamburger-line ${navOpen ? 'nav-hamburger-line--open' : ''}`} />
            </button>
            <div className={`nav-drawer-backdrop ${navOpen ? 'nav-drawer-backdrop--open' : ''}`} onClick={() => setNavOpen(false)} aria-hidden="true" />
            <nav className={`nav-drawer ${navOpen ? 'nav-drawer--open' : ''}`} aria-hidden={!navOpen}>
              <div className="nav-drawer-header">
                <span className="nav-drawer-title">{t.appTitle}</span>
                <button
                  type="button"
                  className="nav-drawer-close"
                  onClick={() => setNavOpen(false)}
                  aria-label="Close menu"
                >
                  <span className="nav-drawer-close-icon" aria-hidden>×</span>
                </button>
              </div>
              <div className="nav-drawer-user">
                <span className="nav-drawer-user-name">{displayName}</span>
                <span className="nav-drawer-user-elo">ELO: {elo ?? '—'}</span>
              </div>
              <div className="nav-drawer-lang">
                {(['en', 'ro', 'ru'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={lang === l ? 'lang-btn active' : 'lang-btn'}
                    onClick={() => setLang(l)}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="nav-drawer-links">
                {navLinks.map(({ view, label }) => (
                  <button
                    key={view}
                    type="button"
                    className={activeView === view ? 'nav-drawer-btn active' : 'nav-drawer-btn'}
                    onClick={() => closeNavAnd(view)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </nav>
          </>
        ) : (
          <nav className="app-nav">
            {navLinks.map(({ view, label }) => (
              <button
                key={view}
                type="button"
                className={activeView === view ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveView(view)}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
        <div className={`header-right ${showHamburger ? 'header-right--desktop-only' : ''}`}>
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
        {user && searchStatus === 'searching' && activeView !== 'ladder' && (
          <button
            type="button"
            className="active-search-banner"
            onClick={() => setActiveView('ladder')}
          >
            <span className="active-search-banner-icon" aria-hidden="true">⏱</span>
            {t.ladderSearching}
            {searchElapsed > 0 && (
              <span className="active-search-banner-time">
                {' '}
                ({Math.floor(searchElapsed / 60)}:{String(searchElapsed % 60).padStart(2, '0')})
              </span>
            )}
          </button>
        )}
        {user && searchStatus === 'in_lobby' && currentMatch && activeView !== 'ladder' && (
          <button
            type="button"
            className="active-lobby-banner"
            onClick={() => setActiveView('ladder')}
          >
            <span className="active-lobby-banner-icon" aria-hidden="true">●</span>
            {t.ladderActiveLobbyBanner}
          </button>
        )}

        {activeView === 'home' && (
          <>
            <section className="hero">
              <h2 className="hero-title">{t.appTitle}</h2>
              <p className="hero-subtitle">{t.appSubtitle}</p>
            </section>
            <section className="home-layout">
              <div className="home-column home-how">
                <h3 className="home-section-title">{t.homeHowTitle}</h3>
                <ol className="home-how-steps">
                  <li>{t.homeHowStep1}</li>
                  <li>{t.homeHowStep2}</li>
                  <li>{t.homeHowStep3}</li>
                </ol>
              </div>
              <div className="home-column home-status">
                <h3 className="home-section-title">{t.homeStatusTitle}</h3>
                <p className="home-status-line">
                  <span className="home-status-label">{t.ratingElo}:</span>{' '}
                  <span className="home-status-value">{elo ?? '—'}</span>
                </p>
                <p className="home-status-line">
                  <span className="home-status-label">{t.ratingMatches}:</span>{' '}
                  <span className="home-status-value">{matchesCount ?? 0}</span>
                </p>
                {matchesCount != null && matchesCount <= 10 && (
                  <p className="home-status-hint">{t.profileCalibrationLabel}</p>
                )}
              </div>
            </section>
          </>
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
              onClick={() => setActiveView('matches')}
            >
              <span className="tile-title">{t.matchesHeader}</span>
              <span className="tile-text">{t.matchesIntro}</span>
            </button>

            <button
              type="button"
              className="tile"
              onClick={() => setActiveView('rating')}
            >
              <span className="tile-title">{t.ratingHeader}</span>
              <span className="tile-text">{t.ratingIntro}</span>
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

        {activeView === 'matches' && (
          <section className="panel">
            <h3 className="panel-title">{t.matchesHeader}</h3>
            <p className="panel-text small">{t.matchesIntro}</p>
            {allMatchesLoading && <p className="panel-text">{t.matchesLoading}</p>}
            {!allMatchesLoading && allMatches.length === 0 && (
              <p className="panel-text">{t.matchesEmpty}</p>
            )}
            {!allMatchesLoading && allMatches.length > 0 && (
              <ul className="matches-list matches-cards">
                {allMatches.map((m) => (
                  <li key={m.match_id} className="match-card">
                    <div className="match-card-team match-card-team-a">
                      <span className="match-card-player">{m.player_a_name}</span>
                    </div>
                    <div className="match-card-score-wrap">
                      <span className="match-card-score">
                        {m.score_a ?? 0} : {m.score_b ?? 0}
                      </span>
                      <span className={`match-card-result match-card-result--${m.result === 'A_WIN' ? 'win' : m.result === 'B_WIN' ? 'loss' : 'draw'}`}>
                        {m.result === 'A_WIN' ? t.matchResultAWin : m.result === 'B_WIN' ? t.matchResultBWin : t.matchResultDraw}
                      </span>
                      {(m.elo_delta_a != null || m.elo_delta_b != null) && (
                        <span className="match-card-elo-delta">
                          {m.elo_delta_a != null ? (m.elo_delta_a > 0 ? `+${m.elo_delta_a}` : m.elo_delta_a) : '0'} /{' '}
                          {m.elo_delta_b != null ? (m.elo_delta_b > 0 ? `+${m.elo_delta_b}` : m.elo_delta_b) : '0'} ELO
                        </span>
                      )}
                      {m.played_at && (
                        <span className="match-card-date">
                          {new Date(m.played_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="match-card-team match-card-team-b">
                      <span className="match-card-player">{m.player_b_name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeView === 'admin' && isAdminUser && (
          <section className="panel admin-panel">
            <h3 className="panel-title">Telegram admin broadcast</h3>
            <p className="panel-text small">
              Отправка сообщений игрокам в Telegram. Используется Bot API, убедись, что все игроки запускали бота.
            </p>
            <div className="form-row">
              <label className="form-label">Текст сообщения</label>
              <textarea
                className="form-input"
                rows={5}
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label className="form-label">Минимальный ELO (опционально)</label>
              <input
                type="number"
                className="form-input"
                value={adminMinElo}
                onChange={(e) => setAdminMinElo(e.target.value)}
                placeholder="например 1500"
              />
            </div>
            <div className="form-row">
              <label className="form-label">Отправить только одному пользователю (username, опционально)</label>
              <input
                type="text"
                className="form-input"
                value={adminTargetUsername}
                onChange={(e) => setAdminTargetUsername(e.target.value)}
                placeholder="@username или пусто для рассылки всем"
              />
            </div>
            {adminResult && <p className="panel-text small">{adminResult}</p>}
            <div className="admin-actions">
              <button
                type="button"
                className="primary-button"
                disabled={adminSending || !adminMessage.trim()}
                onClick={handleAdminSend}
              >
                {adminSending ? 'Отправляем…' : 'Отправить'}
              </button>
            </div>
          </section>
        )}

        {activeView === 'rating' && (
          <section className="panel">
            {profileFromHashLoading && !selectedPlayerRow ? (
              <p className="panel-text">{t.ratingLoading}</p>
            ) : selectedPlayerRow ? (
              <div className="profile-page">
                <button
                  type="button"
                  className="link-button rating-back-btn"
                  onClick={() => {
                    setSelectedPlayerRow(null)
                    window.history.replaceState(null, '', window.location.pathname + window.location.search)
                    window.location.hash = ''
                  }}
                >
                  ← {t.ratingBack}
                </button>
                <div className="profile-page-layout">
                  <aside className="profile-sidebar">
                    <div className="profile-avatar-wrap">
                      {selectedPlayerRow.avatar_url ? (
                        <img src={selectedPlayerRow.avatar_url} alt="" className="profile-avatar-img" />
                      ) : (
                        <div className="profile-avatar-placeholder">
                          {(selectedPlayerRow.display_name ?? '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="profile-sidebar-info">
                      <h2 className="profile-display-name">{selectedPlayerRow.display_name ?? '—'}</h2>
                      {selectedPlayerRow.country_code && (
                        <p className="profile-country-badge">
                          {COUNTRIES.find((c) => c.code === selectedPlayerRow!.country_code)?.flag ?? '🌐'}{' '}
                          {COUNTRIES.find((c) => c.code === selectedPlayerRow!.country_code)?.name ?? selectedPlayerRow.country_code}
                        </p>
                      )}
                    </div>
                  </aside>
                  <div className="profile-main">
                    <div className="profile-rank-card">
                      <span className="profile-rank-badge">#{selectedPlayerRow.rank}</span>
                      <span className="profile-elo-big">{selectedPlayerRow.elo ?? '—'}</span>
                      {selectedPlayerRow.matches_count <= 10 ? (
                        <span className="profile-calibration-label">{t.profileCalibrationLabel}</span>
                      ) : (() => {
                        const rank = getRankFromElo(selectedPlayerRow.elo ?? null)
                        return rank ? (
                          <span className="profile-rank-level">
                            {rank.isElite ? `${t.profileRankElite} 🔥` : t.profileRankLevel.replace('{n}', String(rank.level))}
                          </span>
                        ) : null
                      })()}
                      <p className="profile-matches-summary">
                        {selectedPlayerRow.matches_count} {t.profileMatchesWins.replace('{pct}', selectedPlayerRow.win_rate != null ? String(selectedPlayerRow.win_rate) : '0')}
                      </p>
                    </div>
                    <h4 className="profile-stats-heading">{t.profileStatsSummary}</h4>
                    <div className="profile-stats-grid">
                      <div className="profile-stat-card">
                        <span className="profile-stat-value">{selectedPlayerRow.matches_count}</span>
                        <span className="profile-stat-label">{t.ratingMatches}</span>
                      </div>
                      <div className="profile-stat-card">
                        <span className="profile-stat-value">{selectedPlayerRow.wins}</span>
                        <span className="profile-stat-label">{t.ratingWins}</span>
                      </div>
                      <div className="profile-stat-card">
                        <span className="profile-stat-value">{selectedPlayerRow.draws}</span>
                        <span className="profile-stat-label">{t.ratingDraws}</span>
                      </div>
                      <div className="profile-stat-card">
                        <span className="profile-stat-value">{selectedPlayerRow.losses}</span>
                        <span className="profile-stat-label">{t.ratingLosses}</span>
                      </div>
                      <div className="profile-stat-card">
                        <span className="profile-stat-value">{selectedPlayerRow.goals_for}</span>
                        <span className="profile-stat-label">{t.ratingGoalsFor}</span>
                      </div>
                      <div className="profile-stat-card">
                        <span className="profile-stat-value">{selectedPlayerRow.goals_against}</span>
                        <span className="profile-stat-label">{t.ratingGoalsAgainst}</span>
                      </div>
                      <div className="profile-stat-card profile-stat-card-accent">
                        <span className="profile-stat-value">
                          {selectedPlayerRow.win_rate != null ? `${selectedPlayerRow.win_rate}%` : '—'}
                        </span>
                        <span className="profile-stat-label">{t.ratingWinRate}</span>
                      </div>
                    </div>
                    <h4 className="profile-stats-heading">{t.profileLast10Matches}</h4>
                    {recentMatchesLoading && <p className="panel-text small">…</p>}
                    {!recentMatchesLoading && recentMatches.length === 0 && (
                      <p className="panel-text small">{t.profileRecentMatchesEmpty}</p>
                    )}
                    {!recentMatchesLoading && recentMatches.length > 0 && (
                      <ul className="profile-recent-matches">
                        {recentMatches.map((match) => (
                          <li key={match.match_id} className={`profile-recent-match profile-recent-match--${match.result}`}>
                            <span className="profile-recent-opponent">{match.opponent_name ?? '—'}</span>
                            <span className="profile-recent-score">
                              {match.my_score} : {match.opp_score}
                            </span>
                            <span className="profile-recent-result">
                              {match.result === 'win' ? t.profileResultWin : match.result === 'loss' ? t.profileResultLoss : t.profileResultDraw}
                            </span>
                            {match.played_at && (
                              <span className="profile-recent-date">
                                {new Date(match.played_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h3 className="panel-title">{t.ratingHeader}</h3>
                <p className="panel-text small">{t.ratingIntro}</p>
                {leaderboardLoading && <p className="panel-text">{t.ratingLoading}</p>}
                {!leaderboardLoading && leaderboard.length === 0 && (
                  <p className="panel-text">{t.ratingEmpty}</p>
                )}
                {!leaderboardLoading && leaderboard.length > 0 && (
                  <div className="rating-table-wrap">
                    <table className="rating-table">
                      <thead>
                        <tr>
                          <th>{t.ratingRank}</th>
                          <th>{t.profilePlayerLabel}</th>
                          <th>{t.ratingElo}</th>
                          <th>{t.ratingMatches}</th>
                          <th>{t.ratingWins}</th>
                          <th>{t.ratingDraws}</th>
                          <th>{t.ratingLosses}</th>
                          <th>{t.ratingGoalsFor}</th>
                          <th>{t.ratingGoalsAgainst}</th>
                          <th>{t.ratingWinRate}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((r) => (
                          <tr
                            key={r.player_id}
                            className="rating-row-clickable"
                            onClick={() => setSelectedPlayerRow(r)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setSelectedPlayerRow(r)
                              }
                            }}
                          >
                            <td className="rating-rank-cell">{r.rank}</td>
                            <td className="rating-player-cell">
                              <div className="rating-player-avatar">
                                {r.avatar_url ? (
                                  <img src={r.avatar_url} alt="" />
                                ) : (
                                  <span>{(r.display_name ?? '?').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="rating-player-name">{r.display_name ?? '—'}</span>
                            </td>
                            <td className="rating-elo-cell">{r.elo ?? '—'}</td>
                            <td>{r.matches_count}</td>
                            <td>{r.wins}</td>
                            <td>{r.draws}</td>
                            <td>{r.losses}</td>
                            <td>{r.goals_for}</td>
                            <td>{r.goals_against}</td>
                            <td className="rating-winrate-cell">{r.win_rate != null ? `${r.win_rate}%` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeView === 'profile' && (
          <section className="panel">
            <h3 className="panel-title">{t.profileHeader}</h3>
            {loadingProfile && (
              <p className="panel-text">{t.profileLoading}</p>
            )}
            {profileLoadError && (
              <>
                <p className="panel-text profile-error">{t.profileError}</p>
                <p className="panel-hint profile-error-rls">{t.profileErrorRlsHint}</p>
              </>
            )}

            {user && playerId && !profileLoadError && (
              <div className="profile-page">
                {(loadingProfile || myProfileStatsLoading) ? (
                  <p className="panel-text">{t.profileLoading}</p>
                ) : (
                  <>
                    <div className="profile-page-layout">
                      <aside className="profile-sidebar">
                        <div className="profile-avatar-wrap">
                          {myAvatarUrl ? (
                            <img src={myAvatarUrl} alt="" className="profile-avatar-img" />
                          ) : (
                            <div className="profile-avatar-placeholder">
                              {(displayName || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="profile-sidebar-info">
                          <h2 className="profile-display-name">{displayName}</h2>
                          {myCountryCode && (
                            <p className="profile-country-badge">
                              {COUNTRIES.find((c) => c.code === myCountryCode)?.flag ?? '🌐'}{' '}
                              {COUNTRIES.find((c) => c.code === myCountryCode)?.name ?? myCountryCode}
                            </p>
                          )}
                        </div>
                      </aside>
                      <div className="profile-main">
                        <div className="profile-rank-card">
                          <span className="profile-rank-badge">
                            #{myProfileStats?.rank ?? '—'}
                          </span>
                          <span className="profile-elo-big">{myProfileStats?.elo ?? elo ?? '—'}</span>
                          {(myProfileStats?.matches_count ?? matchesCount ?? 0) <= 10 ? (
                            <span className="profile-calibration-label">{t.profileCalibrationLabel}</span>
                          ) : (() => {
                            const rank = getRankFromElo(myProfileStats?.elo ?? elo ?? null)
                            return rank ? (
                              <span className="profile-rank-level">
                                {rank.isElite ? `${t.profileRankElite} 🔥` : t.profileRankLevel.replace('{n}', String(rank.level))}
                              </span>
                            ) : null
                          })()}
                          <p className="profile-matches-summary">
                            {myProfileStats?.matches_count ?? matchesCount ?? 0} {t.profileMatchesWins.replace('{pct}', myProfileStats?.win_rate != null ? String(myProfileStats.win_rate) : '0')}
                          </p>
                        </div>
                        {myProfileStats && (
                          <>
                            <h4 className="profile-stats-heading">{t.profileStatsSummary}</h4>
                            <div className="profile-stats-grid">
                              <div className="profile-stat-card">
                                <span className="profile-stat-value">{myProfileStats.matches_count}</span>
                                <span className="profile-stat-label">{t.ratingMatches}</span>
                              </div>
                              <div className="profile-stat-card">
                                <span className="profile-stat-value">{myProfileStats.wins}</span>
                                <span className="profile-stat-label">{t.ratingWins}</span>
                              </div>
                              <div className="profile-stat-card">
                                <span className="profile-stat-value">{myProfileStats.draws}</span>
                                <span className="profile-stat-label">{t.ratingDraws}</span>
                              </div>
                              <div className="profile-stat-card">
                                <span className="profile-stat-value">{myProfileStats.losses}</span>
                                <span className="profile-stat-label">{t.ratingLosses}</span>
                              </div>
                              <div className="profile-stat-card">
                                <span className="profile-stat-value">{myProfileStats.goals_for}</span>
                                <span className="profile-stat-label">{t.ratingGoalsFor}</span>
                              </div>
                              <div className="profile-stat-card">
                                <span className="profile-stat-value">{myProfileStats.goals_against}</span>
                                <span className="profile-stat-label">{t.ratingGoalsAgainst}</span>
                              </div>
                              <div className="profile-stat-card profile-stat-card-accent">
                                <span className="profile-stat-value">
                                  {myProfileStats.win_rate != null ? `${myProfileStats.win_rate}%` : '—'}
                                </span>
                                <span className="profile-stat-label">{t.ratingWinRate}</span>
                              </div>
                            </div>
                            <h4 className="profile-stats-heading">{t.profileLast10Matches}</h4>
                            {myRecentMatches.length === 0 ? (
                              <p className="panel-text small">{t.profileRecentMatchesEmpty}</p>
                            ) : (
                              <ul className="profile-recent-matches">
                                {myRecentMatches.map((match) => (
                                  <li key={match.match_id} className={`profile-recent-match profile-recent-match--${match.result}`}>
                                    <span className="profile-recent-opponent">{match.opponent_name ?? '—'}</span>
                                    <span className="profile-recent-score">
                                      {match.my_score} : {match.opp_score}
                                    </span>
                                    <span className="profile-recent-result">
                                      {match.result === 'win' ? t.profileResultWin : match.result === 'loss' ? t.profileResultLoss : t.profileResultDraw}
                                    </span>
                                    {typeof match.elo_delta === 'number' && match.elo_delta !== 0 && (
                                      <span className="profile-recent-elo-delta">
                                        {match.elo_delta > 0 ? `+${match.elo_delta} ELO` : `${match.elo_delta} ELO`}
                                      </span>
                                    )}
                                    {match.played_at && (
                                      <span className="profile-recent-date">
                                        {new Date(match.played_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="profile-edit-section">
                      <h4 className="panel-subtitle">{t.profileDisplayName}</h4>
                      <div className="form-row">
                        <label className="form-label">{t.profileDisplayName}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={myDisplayName}
                          onChange={(e) => setMyDisplayName(e.target.value)}
                          placeholder={user.username ? `@${user.username}` : [user.first_name, user.last_name].filter(Boolean).join(' ')}
                        />
                      </div>
                      <h4 className="panel-subtitle">{t.profileAvatar}</h4>
                      <div className="form-row">
                        <label className="form-label">{t.profileUploadAvatar}</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-input"
                          disabled={avatarUploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) uploadAvatar(f)
                            e.target.value = ''
                          }}
                        />
                        {avatarUploading && <p className="panel-text small">…</p>}
                        {avatarUploadError && (
                          <p className="panel-text panel-error profile-avatar-hint">{avatarUploadError}</p>
                        )}
                      </div>
                      <div className="form-row">
                        <label className="form-label">{t.profileAvatarUrlPlaceholder}</label>
                        <input
                          type="url"
                          className="form-input"
                          value={myAvatarUrl}
                          onChange={(e) => setMyAvatarUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <h4 className="panel-subtitle">{t.profileCountry}</h4>
                      <select
                        className="form-input profile-country-select"
                        value={myCountryCode}
                        onChange={(e) => setMyCountryCode(e.target.value)}
                      >
                        <option value="">—</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="primary-button"
                        disabled={profileSaveLoading}
                        onClick={saveProfileAvatarCountry}
                      >
                        {profileSaveLoading ? '…' : t.profileSave}
                      </button>
                    </div>

                    <div className="profile-telegram">
                      <h4 className="panel-subtitle">{t.profileTelegramTitle}</h4>
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
                      <p className="panel-hint small">{t.profileTelegramDataHint}</p>
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
                    </div>
                  </>
                )}
              </div>
            )}

            {!user && (
              <div className="profile-telegram">
                <h4 className="panel-subtitle">{t.profileTelegramTitle}</h4>
                <p className="panel-text profile-telegram-not">{t.profileTelegramNotConnected}</p>
                {telegramLoginUrl ? (
                  <>
                    <a
                      href={telegramLoginUrl}
                      className="telegram-login-fallback primary-button"
                      rel="noopener noreferrer"
                    >
                      {t.profileTelegramLoginButton}
                    </a>
                    <p className="panel-hint profile-telegram-same-tab">{t.profileTelegramSameTab}</p>
                  </>
                ) : (
                  <div ref={widgetContainerRef} className="profile-telegram-widget" />
                )}
                <p className="panel-hint profile-telegram-setdomain-one">
                  {t.profileTelegramSetDomainOne}{' '}
                  <strong className="profile-telegram-domain">{typeof window !== 'undefined' ? window.location.host : ''}</strong>
                </p>
              </div>
            )}

            {user && (
              <p className="panel-hint">
                {t.profileHint}
              </p>
            )}
          </section>
        )}

        {activeView === 'ladder' && (
          <section className="panel">
            <h3 className="panel-title">{t.ladderHeader}</h3>
            <p className="panel-text">{t.ladderText}</p>

            {!user && (
              <p className="panel-error">{t.ladderLoginRequired}</p>
            )}

            {user && !playerId && (
              <p className="panel-text">
                {loadingProfile ? t.ladderProfileLoading : t.ladderProfileNotReady}
              </p>
            )}

            {user && playerId && searchStatus === 'idle' && (
              <button type="button" className="primary-button" onClick={startSearch}>
                {t.ladderSearchButton}
              </button>
            )}

            {user && searchStatus === 'searching' && (
              <>
                <p className="panel-text">
                  {t.ladderSearching}
                  {searchElapsed > 0 && (
                    <>
                      {' '}
                      ({Math.floor(searchElapsed / 60)}:{String(searchElapsed % 60).padStart(2, '0')})
                    </>
                  )}
                </p>
                <button type="button" className="primary-button secondary" onClick={cancelSearch}>
                  {t.ladderCancelSearch}
                </button>
              </>
            )}

            {user && searchStatus === 'in_lobby' && currentMatch && (
              <div className="lobby-page">
                <header className="lobby-header">
                  <span className="lobby-header-badge">{t.ladderLobbyTitle}</span>
                  <h2 className="lobby-header-vs">{t.ladderLobbyVs.replace('{name}', opponentName)}</h2>
                  <p className="lobby-header-hint">{t.ladderLobbyAgree}</p>
                </header>

                <section className="lobby-chat">
                  <h3 className="lobby-chat-title">{t.ladderChatTitle}</h3>
                  <div ref={chatMessagesScrollRef} className="lobby-chat-messages" role="log" aria-live="polite">
                    {chatLoadError && (
                      <p className="panel-text small lobby-chat-empty lobby-chat-error">{t.ladderChatLoadError}</p>
                    )}
                    {!chatLoadError && chatMessages.length === 0 && (
                      <p className="panel-text small lobby-chat-empty">{t.ladderChatEmpty}</p>
                    )}
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`lobby-chat-msg ${msg.sender_id === playerId ? 'lobby-chat-msg--mine' : 'lobby-chat-msg--theirs'}`}
                      >
                        <span className="lobby-chat-msg-body">{msg.body}</span>
                        <span className="lobby-chat-msg-time">
                          {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    <div ref={chatMessagesEndRef} className="lobby-chat-anchor" aria-hidden="true" />
                  </div>
                  <div className="lobby-chat-form">
                    <input
                      type="text"
                      className="form-input lobby-chat-input"
                      placeholder={t.ladderChatPlaceholder}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                    />
                    <button
                      type="button"
                      className="primary-button lobby-chat-send"
                      disabled={chatSending || !chatInput.trim()}
                      onClick={sendChatMessage}
                    >
                      {chatSending ? '…' : t.ladderChatSend}
                    </button>
                  </div>
                </section>

                {currentMatch.score_submitted_by == null && (
                  <section className="lobby-score-card">
                    <h3 className="lobby-score-title">{t.ladderManualTitle}</h3>
                    <div className="lobby-score-row">
                      <div className="lobby-score-field">
                        <label className="lobby-score-label">{t.ladderMyScore}</label>
                        <input
                          type="number"
                          min={0}
                          className="form-input lobby-score-input"
                          value={scoreA}
                          onChange={(e) => setScoreA(e.target.value)}
                        />
                      </div>
                      <span className="lobby-score-sep">–</span>
                      <div className="lobby-score-field">
                        <label className="lobby-score-label">{t.ladderOppScore}</label>
                        <input
                          type="number"
                          min={0}
                          className="form-input lobby-score-input"
                          value={scoreB}
                          onChange={(e) => setScoreB(e.target.value)}
                        />
                      </div>
                    </div>
                    {matchMessage && (
                      <p className={matchMessage === t.ladderSaved ? 'lobby-message lobby-message--success' : 'lobby-message lobby-message--error'}>
                        {matchMessage}
                      </p>
                    )}
                    <button
                      type="button"
                      className="primary-button lobby-score-submit"
                      disabled={savingMatch}
                      onClick={submitLobbyScore}
                    >
                      {savingMatch ? '…' : t.ladderSubmitScore}
                    </button>
                  </section>
                )}

                {currentMatch.score_submitted_by === playerId && (
                  <section className="lobby-status-card lobby-status-card--waiting">
                    <p className="lobby-status-text">
                      {t.ladderMyScore}: {currentMatch.player_a_id === playerId ? (currentMatch.score_a ?? 0) : (currentMatch.score_b ?? 0)} — {t.ladderOppScore}: {currentMatch.player_a_id === playerId ? (currentMatch.score_b ?? 0) : (currentMatch.score_a ?? 0)}
                    </p>
                    <p className="lobby-status-hint">{t.ladderWaitingConfirm}</p>
                    {matchMessage && <p className="lobby-message lobby-message--success">{matchMessage}</p>}
                  </section>
                )}

                {currentMatch.score_submitted_by === opponentId && (
                  <section className="lobby-status-card lobby-status-card--confirm">
                    <p className="lobby-status-text">
                      {t.ladderOpponentProposed.replace(
                        '{score}',
                        `${currentMatch.score_a ?? 0} – ${currentMatch.score_b ?? 0}`,
                      )}
                    </p>
                    {matchMessage && (
                      <p className={matchMessage === t.ladderResultConfirmed ? 'lobby-message lobby-message--success' : 'lobby-message lobby-message--error'}>
                        {matchMessage}
                      </p>
                    )}
                    <button
                      type="button"
                      className="primary-button lobby-score-submit"
                      disabled={savingMatch}
                      onClick={confirmLobbyResult}
                    >
                      {savingMatch ? '…' : t.ladderConfirmResult}
                    </button>
                  </section>
                )}
              </div>
            )}

            {user && searchStatus === 'idle' && matchMessage && (
              <p className={matchMessage === t.ladderResultConfirmed ? 'panel-success' : 'panel-error'}>{matchMessage}</p>
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
