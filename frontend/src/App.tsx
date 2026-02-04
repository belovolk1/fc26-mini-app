import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './App.css'
import { supabase } from './supabaseClient'

type View = 'home' | 'profile' | 'ladder' | 'tournaments' | 'matches' | 'rating' | 'admin' | 'news-detail'
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
    profileTableScore: string
    profileTableResult: string
    profileTableElo: string
    profileTableDate: string
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
    ratingEmptySelectedPlayer?: string
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
    profileTabOverview: string
    profileTabEdit: string
    profileTabSettings: string
    guestName: string
    homeHeroHeadline: string
    homeHeroDesc: string
    homeJoinNow: string
    homeLearnMore: string
    homePlayNow: string
    homeViewEvents: string
    homeViewStats: string
    homeViewLadder: string
    homeYourStats: string
    homeTopPlayers: string
    homeLatestNews: string
    homeLiveCountdown: string
    homeNewsTitle1: string
    homeNewsDesc1: string
    homeNewsTitle2: string
    homeNewsDesc2: string
    homeNewsTitle3: string
    homeNewsDesc3: string
    newsBack: string
    footerAbout: string
    footerTerms: string
    footerPrivacy: string
    footerContact: string
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
      'news-detail': 'News',
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
    profileTableScore: 'Score',
    profileTableResult: 'Result',
    profileTableElo: 'ELO',
    profileTableDate: 'Date',
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
    ratingEmptySelectedPlayer: 'Click a player in the table to view details.',
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
    profileTabOverview: 'Overview',
    profileTabEdit: 'Edit Profile',
    profileTabSettings: 'Settings',
    guestName: 'Guest',
    homeHeroHeadline: 'COMPETE. CLIMB. DOMINATE.',
    homeHeroDesc: 'Join the ultimate soccer esports ladder. Prove your skills, earn rank, and win prizes.',
    homeJoinNow: 'JOIN NOW',
    homeLearnMore: 'LEARN MORE',
    homePlayNow: 'PLAY NOW',
    homeViewEvents: 'VIEW EVENTS',
    homeViewStats: 'VIEW STATS',
    homeViewLadder: 'VIEW LADDER',
    homeYourStats: 'YOUR STATS',
    homeTopPlayers: 'TOP PLAYERS',
    homeLatestNews: 'LATEST NEWS',
    homeLiveCountdown: 'LIVE COUNTDOWN',
    homeNewsTitle1: 'New season update: map changes & balance',
    homeNewsDesc1: 'Jump into a ranked match instantly. Solo or Duo.',
    homeNewsTitle2: 'Esports finals: watch live!',
    homeNewsDesc2: 'Weekly and monthly cups. Big prizes.',
    homeNewsTitle3: 'Community spotlight: top 10 goals',
    homeNewsDesc3: 'Track your ELO, stats and achievements.',
    newsBack: 'Back to home',
    footerAbout: 'About Us',
    footerTerms: 'Terms of Service',
    footerPrivacy: 'Privacy Policy',
    footerContact: 'Contact',
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
      'news-detail': 'Știri',
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
    profileTableScore: 'Scor',
    profileTableResult: 'Rezultat',
    profileTableElo: 'ELO',
    profileTableDate: 'Data',
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
    ratingEmptySelectedPlayer: 'Alege un jucător din tabel pentru detalii.',
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
    profileTabOverview: 'Prezentare',
    profileTabEdit: 'Editează Profilul',
    profileTabSettings: 'Setări',
    guestName: 'Vizitator',
    homeHeroHeadline: 'CONCURĂ. URCA. DOMINĂ.',
    homeHeroDesc: 'Alătură-te ladder-ului esports de fotbal. Demonstrează-ți skill-urile, câștigă rang și premii.',
    homeJoinNow: 'ÎNSCRIE-TE',
    homeLearnMore: 'AFLĂ MAI MULT',
    homePlayNow: 'JOACĂ ACUM',
    homeViewEvents: 'VEZI EVENIMENTE',
    homeViewStats: 'VEZI STATISTICI',
    homeViewLadder: 'VEZI CLASAMENT',
    homeYourStats: 'STATISTICILE TALE',
    homeTopPlayers: 'TOP JUCĂTORI',
    homeLatestNews: 'ȘTIRI RECENTE',
    homeLiveCountdown: 'COUNTDOWN LIVE',
    homeNewsTitle1: 'Actualizare sezon: hărți și balans',
    homeNewsDesc1: 'Intră într-un meci ranked instant. Solo sau Duo.',
    homeNewsTitle2: 'Finale esports: urmărește live!',
    homeNewsDesc2: 'Cupe săptămânale și lunare. Premii mari.',
    homeNewsTitle3: 'Community spotlight: top 10 goluri',
    homeNewsDesc3: 'Urmărește ELO, statistici și realizări.',
    newsBack: 'Înapoi la prima pagină',
    footerAbout: 'Despre noi',
    footerTerms: 'Termeni și condiții',
    footerPrivacy: 'Confidențialitate',
    footerContact: 'Contact',
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
      'news-detail': 'Новость',
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
    profileTableScore: 'Счёт',
    profileTableResult: 'Результат',
    profileTableElo: 'ELO',
    profileTableDate: 'Дата',
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
    ratingEmptySelectedPlayer: 'Нажми на игрока в таблице, чтобы увидеть детали.',
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
    profileTabOverview: 'Обзор',
    profileTabEdit: 'Редактировать',
    profileTabSettings: 'Настройки',
    guestName: 'Гость',
    homeHeroHeadline: 'СРАЖАЙСЯ. РАСТИ. ДОМИНИРУЙ.',
    homeHeroDesc: 'Присоединяйся к футбольному esports-рейтингу. Докажи навыки, получай ранг и призы.',
    homeJoinNow: 'ПРИСОЕДИНИТЬСЯ',
    homeLearnMore: 'ПОДРОБНЕЕ',
    homePlayNow: 'ИГРАТЬ',
    homeViewEvents: 'СОБЫТИЯ',
    homeViewStats: 'СТАТИСТИКА',
    homeViewLadder: 'РЕЙТИНГ',
    homeYourStats: 'ТВОЯ СТАТИСТИКА',
    homeTopPlayers: 'ТОП ИГРОКИ',
    homeLatestNews: 'ПОСЛЕДНИЕ НОВОСТИ',
    homeLiveCountdown: 'ДО СТАРТА',
    homeNewsTitle1: 'Новый сезон: карты и баланс',
    homeNewsDesc1: 'Начни рейтинговый матч мгновенно. Соло или дуо.',
    homeNewsTitle2: 'Финалы esports: смотри вживую!',
    homeNewsDesc2: 'Еженедельные и месячные кубки. Крупные призы.',
    homeNewsTitle3: 'Лучшие голы сообщества',
    homeNewsDesc3: 'Отслеживай ELO, статистику и достижения.',
    newsBack: 'Назад на главную',
    footerAbout: 'О нас',
    footerTerms: 'Условия использования',
    footerPrivacy: 'Конфиденциальность',
    footerContact: 'Контакты',
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

/** Текст ранга для UI: LEVEL 1 … LEVEL 10 - ELITE (заглушки как на референсе) */
function getRankDisplayLabel(rank: { level: number; isElite: boolean } | null): string {
  if (!rank) return '—'
  if (rank.isElite) return 'LEVEL 10 - ELITE'
  return `LEVEL ${rank.level}`
}

/* === SVG иконки для профиля (тематика: ранги, статы, матчи) === */
const ProfileRankBadgeSvg = () => (
  <svg className="profile-rank-badge-svg" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <defs>
      <linearGradient id="rankShieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ff9f43" />
        <stop offset="100%" stopColor="#cc5500" />
      </linearGradient>
      <filter id="rankGlow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <path d="M32 4L8 14v20c0 14 10 26 24 34 14-8 24-20 24-34V14L32 4z" fill="url(#rankShieldGrad)" stroke="rgba(255,140,0,0.8)" strokeWidth="2" filter="url(#rankGlow)" />
    <path d="M20 28l24 24M44 28L20 52" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
  </svg>
)
const IconMatchesSvg = () => (
  <svg className="profile-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 6l6-3 3 3-3 6-3-3" />
    <path d="M9.5 17.5L21 9v3l-8.5 8.5-3-3z" />
  </svg>
)
const IconWinsSvg = () => (
  <svg className="profile-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 2L15 9l7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z" />
  </svg>
)
const IconDrawsSvg = () => (
  <svg className="profile-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M9 12h6M8 16h8M12 8v8M4 14h2M18 14h2M14 4v2M10 20v-2" />
  </svg>
)
const IconLossesSvg = () => (
  <svg className="profile-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const IconGoalsSvg = () => (
  <svg className="profile-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 19V5M5 12l7-7 7 7" />
    <path d="M5 12h14" />
  </svg>
)
const IconWinRateSvg = () => (
  <svg className="profile-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 0 20" />
    <path d="M12 2v10l5 5" />
  </svg>
)
const IconEloUpSvg = () => (
  <svg className="profile-elo-arrow" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 4l4 6H4l4-6z" /></svg>
)
const IconEloDownSvg = () => (
  <svg className="profile-elo-arrow" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 12l4-6H4l4 6z" /></svg>
)

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
  const [profileActiveTab, setProfileActiveTab] = useState<'overview' | 'edit' | 'settings'>('overview')
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

  type NewsRow = { id: string; title: string; body: string; image_url: string | null; created_at: string }
  type TournamentRow = {
    id: string
    name: string
    status: string
    registration_start: string
    registration_end: string
    tournament_start: string
    tournament_end: string
    round_duration_minutes: number
    prize_pool: { place: number; elo_bonus: number }[]
    created_at: string
    registrations_count: number
  }
  type TournamentMatchRow = {
    id: string
    tournament_id: string
    round: number
    match_index: number
    player_a_id: string | null
    player_b_id: string | null
    score_a: number | null
    score_b: number | null
    winner_id: string | null
    status: string
    score_submitted_by: string | null
    player_a_ready_at: string | null
    player_b_ready_at: string | null
    scheduled_start: string
    scheduled_end: string
  }
  const [newsList, setNewsList] = useState<NewsRow[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsTitle, setNewsTitle] = useState('')
  const [newsBody, setNewsBody] = useState('')
  const [newsImageFile, setNewsImageFile] = useState<File | null>(null)
  const [newsSending, setNewsSending] = useState(false)
  const [newsResult, setNewsResult] = useState<string | null>(null)
  const [selectedNews, setSelectedNews] = useState<NewsRow | null>(null)
  const [newsDetailLoading, setNewsDetailLoading] = useState(false)

  const [tournamentsList, setTournamentsList] = useState<TournamentRow[]>([])
  const [tournamentsLoading, setTournamentsLoading] = useState(false)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null)
  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatchRow[]>([])
  const [tournamentRegistrations, setTournamentRegistrations] = useState<Set<string>>(new Set())
  const [adminTourName, setAdminTourName] = useState('')
  const [adminTourRegStart, setAdminTourRegStart] = useState('')
  const [adminTourRegEnd, setAdminTourRegEnd] = useState('')
  const [adminTourStart, setAdminTourStart] = useState('')
  const [adminTourEnd, setAdminTourEnd] = useState('')
  const [adminTourRoundMins, setAdminTourRoundMins] = useState('30')
  const [adminTourPrizePool, setAdminTourPrizePool] = useState<{ place: number; elo_bonus: number }[]>([{ place: 1, elo_bonus: 50 }, { place: 2, elo_bonus: 30 }])
  const [adminTourSending, setAdminTourSending] = useState(false)
  const [adminTourResult, setAdminTourResult] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash
    const m = hash.match(/^#news=(.+)$/)
    if (m) {
      const id = m[1].trim()
      setActiveView('news-detail')
      setSelectedNews(null)
      setNewsDetailLoading(true)
      supabase
        .from('news')
        .select('id, title, body, image_url, created_at')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          setNewsDetailLoading(false)
          if (!error && data) setSelectedNews(data as NewsRow)
        })
    }
  }, [])

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

  // Полная статистика своего профиля (профиль и главная — блок Your Stats)
  useEffect(() => {
    if (!playerId) return
    if (activeView !== 'profile' && activeView !== 'home') {
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

  // Когда полная статистика профиля обновилась — синхронизируем ELO и общее число матчей в шапке
  useEffect(() => {
    if (myProfileStats?.elo != null) {
      setElo(myProfileStats.elo)
    }
    if (myProfileStats?.matches_count != null) {
      setMatchesCount(myProfileStats.matches_count)
    }
  }, [myProfileStats])

  const displayName = useMemo(() => {
    if (!user) return t.guestName
    if (myDisplayName.trim()) return myDisplayName.trim()
    const realName = [user.first_name, user.last_name].filter(Boolean).join(' ')
    if (realName) return realName
    if (user.username) return `@${user.username}`
    return t.guestName
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
            // сразу после засчитанного матча перезагружаем профиль,
            // чтобы ELO и статы в шапке обновились в реальном времени
            void supabase
              .rpc('get_player_profile', { p_player_id: playerId })
              .then(({ data, error }) => {
                if (!error && Array.isArray(data) && data[0]) {
                  setMyProfileStats(data[0] as LeaderboardRow)
                }
              })
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
        void supabase
          .rpc('get_player_profile', { p_player_id: playerId })
          .then(({ data: prof, error: profErr }) => {
            if (!profErr && Array.isArray(prof) && prof[0]) {
              setMyProfileStats(prof[0] as LeaderboardRow)
            }
          })
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
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
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

      const rawTarget = adminTargetUsername.trim()
      if (rawTarget) {
        // Если введены только цифры — считаем, что это telegram_id (chat_id)
        const digitsOnly = /^[0-9]+$/.test(rawTarget)
        if (digitsOnly) {
          payload.targetTelegramId = rawTarget
        } else {
          // Иначе используем username как раньше
          payload.targetUsername = rawTarget
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Admin-Token': token,
      }
      // Добавляем Authorization заголовок для Supabase Edge Functions
      if (anonKey) {
        headers['Authorization'] = `Bearer ${anonKey}`
      }

      console.log('Sending request to:', endpoint, { headers: { ...headers, 'X-Admin-Token': headers['X-Admin-Token'] ? '***' : 'missing' } })
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }).catch((fetchError) => {
        console.error('Fetch error:', fetchError)
        throw fetchError
      })
      if (!resp.ok) {
        const txt = await resp.text()
        setAdminResult(`Ошибка отправки: ${resp.status} ${resp.statusText} - ${txt}`)
      } else {
        const data = await resp.json().catch(() => ({})) as { sent?: number; failed?: number; sentTo?: string[]; failedTo?: string[] }
        if (payload.mode === 'single') {
          const recipient = data.sentTo?.[0] || payload.targetUsername || 'пользователю'
          setAdminResult(`Сообщение отправлено пользователю: ${recipient}`)
        } else {
          let result = `Рассылка завершена:\n`
          result += `✓ Отправлено: ${data.sent ?? 0}`
          if (data.sentTo && data.sentTo.length > 0) {
            result += ` (${data.sentTo.join(', ')})`
          }
          if (data.failed && data.failed > 0) {
            result += `\n✗ Ошибок: ${data.failed}`
            if (data.failedTo && data.failedTo.length > 0) {
              result += `\n\nДетали ошибок:\n${data.failedTo.join('\n')}`
            }
          }
          setAdminResult(result)
        }
        setAdminMessage('')
      }
    } catch (e: any) {
      const errorMsg = e?.message || String(e)
      const errorName = e?.name || 'Unknown'
      console.error('Admin broadcast error:', { error: e, endpoint, errorMsg, errorName })
      setAdminResult(`Ошибка сети: ${errorName} - ${errorMsg}. Проверь URL функции: ${endpoint}`)
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

  const handlePlayNowClick = async () => {
    setActiveView('ladder')
    if (searchStatus === 'idle') {
      await startSearch()
    }
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

  // Загрузка рейтинга при открытии страницы «Рейтинг», главной (Top Players) или турниров (имена в сетке)
  useEffect(() => {
    if (activeView !== 'rating' && activeView !== 'home' && activeView !== 'tournaments') return
    if (activeView === 'rating' && !window.location.hash.includes('player=')) setSelectedPlayerRow(null)
    setLeaderboardLoading(true)
    supabase.rpc('get_leaderboard').then(({ data, error }) => {
      setLeaderboardLoading(false)
      if (!error && Array.isArray(data)) setLeaderboard(data as LeaderboardRow[])
      else setLeaderboard([])
    })
  }, [activeView])

  const formatNewsDate = (createdAt: string) => {
    const d = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const fetchNews = () => {
    setNewsLoading(true)
    supabase
      .from('news')
      .select('id, title, body, image_url, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setNewsLoading(false)
        if (!error && Array.isArray(data)) setNewsList(data as NewsRow[])
        else setNewsList([])
      })
  }

  useEffect(() => {
    if (activeView === 'home' || activeView === 'admin') fetchNews()
  }, [activeView])

  const NEWS_BUCKET = 'news'
  const addNews = async () => {
    const title = newsTitle.trim()
    if (!title || !isAdminUser) return
    setNewsSending(true)
    setNewsResult(null)
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('news')
        .insert({ title, body: newsBody.trim() || '', image_url: null })
        .select('id')
        .single()
      if (insertErr) {
        setNewsResult(`Ошибка: ${insertErr.message}`)
        setNewsSending(false)
        return
      }
      const id = (inserted as { id: string }).id
      let imageUrl: string | null = null
      if (newsImageFile && newsImageFile.type.startsWith('image/')) {
        const ext = newsImageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${id}.${ext}`
        const { error: uploadErr } = await supabase.storage.from(NEWS_BUCKET).upload(path, newsImageFile, { upsert: true })
        if (uploadErr) {
          setNewsResult(`Новость создана, но фото не загрузилось: ${uploadErr.message}. Проверьте, что бакет "news" создан и включён как Public в Supabase → Storage.`)
          setNewsSending(false)
          fetchNews()
          return
        }
        const { data: urlData } = supabase.storage.from(NEWS_BUCKET).getPublicUrl(path)
        imageUrl = urlData.publicUrl
        const { error: updateErr } = await supabase.from('news').update({ image_url: imageUrl }).eq('id', id)
        if (updateErr) {
          setNewsResult(`Новость создана, фото загружено, но ссылку не удалось сохранить: ${updateErr.message}.`)
          setNewsSending(false)
          fetchNews()
          return
        }
      }
      setNewsTitle('')
      setNewsBody('')
      setNewsImageFile(null)
      fetchNews()
      setNewsResult('Новость добавлена.')
    } catch (e: any) {
      setNewsResult(`Ошибка: ${e?.message || String(e)}`)
    } finally {
      setNewsSending(false)
    }
  }

  const deleteNews = async (id: string) => {
    if (!isAdminUser) return
    const { error } = await supabase.from('news').delete().eq('id', id)
    if (!error) fetchNews()
  }

  const fetchTournaments = async () => {
    setTournamentsLoading(true)
    try {
      await supabase.rpc('tournament_tick', { p_tournament_id: null })
    } catch {
      /* RPC может отсутствовать (404) */
    }
    const { data: list, error } = await supabase.rpc('get_tournaments_with_counts')
    if (!error && Array.isArray(list) && list.length > 0) {
      setTournamentsList(list.map((r: any) => ({
        ...r,
        name: r.name ?? r.title ?? 'Tournament',
        prize_pool: Array.isArray(r.prize_pool) ? r.prize_pool : [],
        registrations_count: Number(r.registrations_count ?? 0),
      })))
    } else {
      const { data: rows, error: tableError } = await supabase
        .from('tournaments')
        .select('*')
        .order('registration_start', { ascending: false })
      if (!tableError && Array.isArray(rows) && rows.length > 0) {
        const ids = (rows as any[]).map((x) => x.id)
        const { data: counts } = await supabase.from('tournament_registrations').select('tournament_id').in('tournament_id', ids)
        const countByTour = (counts || []).reduce((acc: Record<string, number>, r: { tournament_id: string }) => {
          acc[r.tournament_id] = (acc[r.tournament_id] ?? 0) + 1
          return acc
        }, {})
        setTournamentsList(rows.map((r: any) => ({
          id: r.id,
          name: r.name ?? r.title ?? 'Tournament',
          status: r.status ?? 'draft',
          registration_start: r.registration_start ?? r.created_at,
          registration_end: r.registration_end ?? r.created_at,
          tournament_start: r.tournament_start ?? r.starts_at ?? r.created_at,
          tournament_end: r.tournament_end ?? r.ends_at ?? r.created_at,
          round_duration_minutes: r.round_duration_minutes ?? 30,
          prize_pool: Array.isArray(r.prize_pool) ? r.prize_pool : [],
          created_at: r.created_at ?? new Date().toISOString(),
          registrations_count: countByTour[r.id] ?? 0,
        })))
      } else {
        setTournamentsList([])
      }
    }
    if (playerId) {
      const { data: regs } = await supabase.from('tournament_registrations').select('tournament_id').eq('player_id', playerId)
      setTournamentRegistrations(new Set((regs || []).map((r: { tournament_id: string }) => r.tournament_id)))
    }
    setTournamentsLoading(false)
  }

  useEffect(() => {
    if (activeView === 'tournaments' || activeView === 'admin') fetchTournaments()
  }, [activeView, playerId])

  useEffect(() => {
    if (activeView !== 'tournaments') return
    const runTick = async () => {
      await supabase.rpc('tournament_tick', { p_tournament_id: null })
      fetchTournaments()
      if (selectedTournamentId) {
        const { data } = await supabase.from('tournament_matches').select('*').eq('tournament_id', selectedTournamentId).order('round', { ascending: false }).order('match_index')
        if (data) setTournamentMatches(data as TournamentMatchRow[])
      }
    }
    runTick()
    const interval = setInterval(runTick, 60000)
    return () => clearInterval(interval)
  }, [activeView, selectedTournamentId])

  useEffect(() => {
    if (!selectedTournamentId) {
      setTournamentMatches([])
      return
    }
    const load = async () => {
      const { data } = await supabase.from('tournament_matches').select('*').eq('tournament_id', selectedTournamentId).order('round', { ascending: false }).order('match_index')
      setTournamentMatches((data || []) as TournamentMatchRow[])
    }
    load()
  }, [selectedTournamentId])

  // Realtime: всё содержимое страницы турниров обновляется в реальном времени (как рейтинг в шапке)
  useEffect(() => {
    if (activeView !== 'tournaments' && activeView !== 'admin') return
    const refreshTournamentsAndMatches = () => {
      fetchTournaments()
      if (selectedTournamentId) {
        supabase
          .from('tournament_matches')
          .select('*')
          .eq('tournament_id', selectedTournamentId)
          .order('round', { ascending: false })
          .order('match_index')
          .then(({ data }) => {
            if (data) setTournamentMatches(data as TournamentMatchRow[])
          })
      }
    }
    const ch = supabase
      .channel('tournaments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => refreshTournamentsAndMatches())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_registrations' }, () => refreshTournamentsAndMatches())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches' }, () => refreshTournamentsAndMatches())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [activeView, selectedTournamentId])

  const createTournament = async () => {
    if (!isAdminUser) return
    const name = adminTourName.trim()
    const regStart = adminTourRegStart.trim()
    const regEnd = adminTourRegEnd.trim()
    const tourStart = adminTourStart.trim()
    const tourEnd = adminTourEnd.trim()
    const roundMins = parseInt(adminTourRoundMins, 10)
    if (!name || !regStart || !regEnd || !tourStart || !tourEnd || Number.isNaN(roundMins) || roundMins < 1) {
      setAdminTourResult('Заполните все поля и укажите длительность раунда (мин).')
      return
    }
    setAdminTourSending(true)
    setAdminTourResult(null)
    try {
      const now = new Date().toISOString().slice(0, 16)
      const status = now >= regStart ? 'registration' : 'draft'
      const { error } = await supabase
        .from('tournaments')
        .insert({
          name,
          status,
          registration_start: new Date(regStart).toISOString(),
          registration_end: new Date(regEnd).toISOString(),
          tournament_start: new Date(tourStart).toISOString(),
          tournament_end: new Date(tourEnd).toISOString(),
          round_duration_minutes: roundMins,
          prize_pool: adminTourPrizePool.filter((p) => p.place >= 1 && p.elo_bonus >= 0),
        })
        .select('id')
        .single()
      if (error) {
        setAdminTourResult(`Ошибка: ${error.message}`)
        setAdminTourSending(false)
        return
      }
      setAdminTourName('')
      setAdminTourRegStart('')
      setAdminTourRegEnd('')
      setAdminTourStart('')
      setAdminTourEnd('')
      setAdminTourRoundMins('30')
      setAdminTourPrizePool([{ place: 1, elo_bonus: 50 }, { place: 2, elo_bonus: 30 }])
      fetchTournaments()
      setAdminTourResult('Турнир создан.')
    } catch (e: any) {
      setAdminTourResult(e?.message || 'Ошибка')
    } finally {
      setAdminTourSending(false)
    }
  }

  const tournamentRegister = async (tournamentId: string) => {
    if (!playerId) return
    const { error } = await supabase.from('tournament_registrations').insert({ tournament_id: tournamentId, player_id: playerId })
    if (!error) {
      setTournamentRegistrations((prev) => new Set(prev).add(tournamentId))
      fetchTournaments()
    }
  }

  const tournamentUnregister = async (tournamentId: string) => {
    if (!playerId) return
    const { error } = await supabase.from('tournament_registrations').delete().eq('tournament_id', tournamentId).eq('player_id', playerId)
    if (!error) {
      setTournamentRegistrations((prev) => {
        const next = new Set(prev)
        next.delete(tournamentId)
        return next
      })
      fetchTournaments()
    }
  }

  const deleteTournament = async (tournamentId: string) => {
    if (!isAdminUser) return
    if (!window.confirm('Удалить турнир? Регистрации и матчи будут удалены.')) return
    setAdminTourResult(null)
    const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId)
    if (error) {
      setAdminTourResult(`Ошибка удаления: ${error.message}. Выполни в Supabase SQL: CREATE POLICY "tournaments_delete" ON tournaments FOR DELETE TO anon USING (true);`)
    } else {
      if (selectedTournamentId === tournamentId) setSelectedTournamentId(null)
      fetchTournaments()
      setAdminTourResult('Турнир удалён.')
    }
  }

  const tournamentTick = async (tournamentId: string) => {
    await supabase.rpc('tournament_tick', { p_tournament_id: tournamentId })
    fetchTournaments()
    if (selectedTournamentId === tournamentId) {
      const { data } = await supabase.from('tournament_matches').select('*').eq('tournament_id', tournamentId).order('round', { ascending: false }).order('match_index')
      setTournamentMatches((data || []) as TournamentMatchRow[])
    }
  }

  const tournamentStartBracket = async (tournamentId: string) => {
    const { data } = await supabase.rpc('tournament_start_bracket', { p_tournament_id: tournamentId })
    const res = data as { ok?: boolean; error?: string }
    if (res?.ok) {
      fetchTournaments()
      if (selectedTournamentId === tournamentId) {
        const { data: matches } = await supabase.from('tournament_matches').select('*').eq('tournament_id', tournamentId).order('round', { ascending: false }).order('match_index')
        setTournamentMatches((matches || []) as TournamentMatchRow[])
      }
    }
    return res
  }

  function TournamentBracketBlock(props: {
    tournament: TournamentRow
    matches: TournamentMatchRow[]
    playerId: string | null
    leaderboard: LeaderboardRow[]
    onRefresh: () => void | Promise<void>
  }) {
    const { matches, playerId: pid, leaderboard, onRefresh } = props
    const [matchMessage, setMatchMessage] = useState<string | null>(null)
    const [savingMatchId, setSavingMatchId] = useState<string | null>(null)
    const [scoreInputs, setScoreInputs] = useState<Record<string, { a: string; b: string }>>({})

    const getPlayerName = (id: string | null) => {
      if (!id) return '—'
      const r = leaderboard.find((x) => x.player_id === id)
      return r?.display_name || id.slice(0, 8)
    }

    const rounds = useMemo(() => {
      const byRound: Record<number, TournamentMatchRow[]> = {}
      matches.forEach((m) => {
        if (!byRound[m.round]) byRound[m.round] = []
        byRound[m.round].push(m)
      })
      Object.keys(byRound).forEach((r) => byRound[Number(r)].sort((a, b) => a.match_index - b.match_index))
      return byRound
    }, [matches])

    const roundNames: Record<number, string> = { 1: 'Финал', 2: '1/2 финала', 3: '1/4 финала', 4: '1/8 финала', 5: '1/16', 6: '1/32' }

    const markReady = async (m: TournamentMatchRow) => {
      if (!pid) return
      setSavingMatchId(m.id)
      setMatchMessage(null)
      const isA = m.player_a_id === pid
      const { error } = await supabase
        .from('tournament_matches')
        .update(isA ? { player_a_ready_at: new Date().toISOString(), status: m.player_b_ready_at ? 'both_ready' : 'ready_a' } : { player_b_ready_at: new Date().toISOString(), status: m.player_a_ready_at ? 'both_ready' : 'ready_b' })
        .eq('id', m.id)
      setSavingMatchId(null)
      if (error) setMatchMessage(error.message)
      else void onRefresh()
    }

    const submitScore = async (m: TournamentMatchRow) => {
      if (!pid) return
      const inp = scoreInputs[m.id] || { a: String(m.score_a ?? 0), b: String(m.score_b ?? 0) }
      const a = parseInt(inp.a, 10)
      const b = parseInt(inp.b, 10)
      if (Number.isNaN(a) || Number.isNaN(b)) {
        setMatchMessage('Введите счёт')
        return
      }
      setSavingMatchId(m.id)
      setMatchMessage(null)
      const isA = m.player_a_id === pid
      const { error } = await supabase
        .from('tournament_matches')
        .update({ score_a: isA ? a : b, score_b: isA ? b : a, score_submitted_by: pid, status: 'score_submitted' })
        .eq('id', m.id)
      setSavingMatchId(null)
      if (error) setMatchMessage(error.message)
      else void onRefresh()
    }

    const confirmScore = async (m: TournamentMatchRow) => {
      if (!pid || m.player_a_id === null || m.player_b_id === null) return
      const sa = m.score_a ?? 0
      const sb = m.score_b ?? 0
      const winner = sa > sb ? m.player_a_id : sb > sa ? m.player_b_id : null
      setSavingMatchId(m.id)
      setMatchMessage(null)
      const { error } = await supabase.from('tournament_matches').update({ winner_id: winner, status: 'confirmed' }).eq('id', m.id)
      setSavingMatchId(null)
      if (error) setMatchMessage(error.message)
      else void onRefresh()
    }

    return (
      <div className="tournament-bracket">
        {matchMessage && <p className="panel-text small">{matchMessage}</p>}
        {[1, 2, 3, 4, 5, 6].filter((r) => rounds[r]?.length).map((roundNum) => (
          <div key={roundNum} className="bracket-round">
            <h4 className="bracket-round-title">{roundNames[roundNum] || `Раунд ${roundNum}`}</h4>
            <div className="bracket-matches">
              {(rounds[roundNum] || []).map((m) => {
                const isPlayerA = m.player_a_id === pid
                const isPlayerB = m.player_b_id === pid
                const isInMatch = isPlayerA || isPlayerB
                const needsReady = isInMatch && ((isPlayerA && !m.player_a_ready_at) || (isPlayerB && !m.player_b_ready_at))
                const canSubmit = isInMatch && (m.status === 'both_ready' || m.status === 'score_submitted') && m.score_submitted_by !== pid
                const canConfirm = isInMatch && m.status === 'score_submitted' && m.score_submitted_by !== pid
                const finished = ['confirmed', 'finished', 'auto_win_a', 'auto_win_b', 'auto_no_show'].includes(m.status)
                const inp = scoreInputs[m.id] ?? { a: String(m.score_a ?? ''), b: String(m.score_b ?? '') }
                return (
                  <div key={m.id} className="bracket-match strike-card">
                    <div className="bracket-match-players">
                      <span className={m.winner_id === m.player_a_id ? 'bracket-winner' : ''}>{getPlayerName(m.player_a_id)}</span>
                      <span className="bracket-vs"> – </span>
                      <span className={m.winner_id === m.player_b_id ? 'bracket-winner' : ''}>{getPlayerName(m.player_b_id)}</span>
                    </div>
                    <div className="bracket-match-score">
                      {m.score_a != null && m.score_b != null ? `${m.score_a} : ${m.score_b}` : '—'}
                    </div>
                    <div className="bracket-match-meta panel-text small">
                      {new Date(m.scheduled_start).toLocaleString()} – {new Date(m.scheduled_end).toLocaleString()} · {m.status}
                    </div>
                    {isInMatch && !finished && (
                      <div className="bracket-match-actions">
                        {needsReady && (
                          <button type="button" className="strike-btn strike-btn-primary" disabled={savingMatchId === m.id} onClick={() => markReady(m)}>
                            {savingMatchId === m.id ? '…' : 'Готов играть'}
                          </button>
                        )}
                        {(m.status === 'both_ready' || m.status === 'score_submitted') && (
                          <div className="bracket-match-score-entry">
                            <div className="bracket-match-score-entry-title">Результат матча</div>
                            <p className="bracket-match-score-entry-hint">
                              {m.status === 'score_submitted' && canConfirm
                                ? 'Соперник ввёл счёт. Подтвердите результат, если он верный.'
                                : 'Введите счёт и нажмите «Отправить счёт». Соперник должен подтвердить результат.'}
                            </p>
                            <div className="bracket-match-score-entry-row">
                              <label className="bracket-score-label">Ваши голы</label>
                              <input type="number" min={0} className="form-input bracket-score-input" value={isPlayerA ? inp.a : inp.b} onChange={(e) => setScoreInputs((prev) => ({ ...prev, [m.id]: { ...prev[m.id], a: isPlayerA ? e.target.value : prev[m.id]?.a ?? '', b: isPlayerB ? e.target.value : prev[m.id]?.b ?? '' } }))} />
                              <span className="bracket-score-sep">–</span>
                              <label className="bracket-score-label">Голы соперника</label>
                              <input type="number" min={0} className="form-input bracket-score-input" value={isPlayerA ? inp.b : inp.a} onChange={(e) => setScoreInputs((prev) => ({ ...prev, [m.id]: { ...prev[m.id], a: isPlayerB ? e.target.value : prev[m.id]?.a ?? '', b: isPlayerA ? e.target.value : prev[m.id]?.b ?? '' } }))} />
                              {canSubmit && <button type="button" className="strike-btn strike-btn-secondary" disabled={savingMatchId === m.id} onClick={() => submitScore(m)}>Отправить счёт</button>}
                              {canConfirm && <button type="button" className="strike-btn strike-btn-primary" disabled={savingMatchId === m.id} onClick={() => confirmScore(m)}>Подтвердить результат</button>}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

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
    <div className={`app ${useMobileLayout ? 'app--mobile' : 'app--desktop'} strike-theme${activeView === 'rating' && selectedPlayerRow ? ' rating-modal-open' : ''}`}>
      <div className="site-header strike-header">
        <header className="app-header">
          <div className="app-header-main">
            <span className="strike-logo-icon" aria-hidden="true">⚽</span>
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
            {navOpen && createPortal(
              <div className="app strike-theme" style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
                <div className={`nav-drawer-backdrop nav-drawer-backdrop--open`} style={{ pointerEvents: 'auto' }} onClick={() => setNavOpen(false)} aria-hidden="true" />
                <nav className="nav-drawer nav-drawer--open" style={{ pointerEvents: 'auto' }} aria-hidden={false}>
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
              </div>,
              document.body
            )}
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
          <div className="strike-header-user">
            <div className="strike-header-avatar">
              {myAvatarUrl ? (
                <img src={myAvatarUrl} alt="" width={36} height={36} />
              ) : (
                <span>{(displayName || '?').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="strike-header-user-info">
              <span className="app-user-name">{displayName}</span>
              <div className="strike-header-elo-wrap">
                <div className="strike-header-elo-bar">
                  <div
                    className="strike-header-elo-bar-fill"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((elo ?? 1200) - 800) / 12))}%`,
                    }}
                  />
                </div>
                <span className="strike-header-elo-value">{elo ?? '—'} ELO</span>
              </div>
            </div>
            <button
              type="button"
              className="strike-header-cta strike-btn strike-btn-primary"
              onClick={
                searchStatus === 'searching'
                  ? cancelSearch
                  : () => {
                      void handlePlayNowClick()
                    }
              }
            >
              {searchStatus === 'idle'
                ? t.homePlayNow
                : searchStatus === 'searching'
                  ? t.ladderSearching
                  : t.ladderLobbyTitle}
            </button>
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
            {/* Hero: headline left, CTA buttons, soccer field right */}
            <section className="strike-hero">
              <div className="strike-hero-content">
                <h1 className="strike-hero-title">{t.homeHeroHeadline}</h1>
                <p className="strike-hero-desc">{t.homeHeroDesc}</p>
                <div className="strike-hero-buttons">
                  <button type="button" className="strike-btn strike-btn-primary" onClick={() => setActiveView('ladder')}>
                    {t.homeJoinNow}
            </button>
                  <button type="button" className="strike-btn strike-btn-secondary" onClick={() => setActiveView('tournaments')}>
                    {t.homeLearnMore}
                  </button>
                </div>
              </div>
              <div className="strike-hero-graphic" aria-hidden="true">
                <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="strike-field-svg">
                  <rect x="10" y="10" width="180" height="100" stroke="currentColor" strokeWidth="2" rx="4" opacity="0.4" />
                  <circle cx="100" cy="60" r="20" stroke="currentColor" strokeWidth="2" opacity="0.5" />
                  <line x1="100" y1="10" x2="100" y2="110" stroke="currentColor" strokeWidth="2" opacity="0.4" />
                  <rect x="10" y="35" width="30" height="50" stroke="currentColor" strokeWidth="2" rx="2" opacity="0.4" />
                  <rect x="160" y="35" width="30" height="50" stroke="currentColor" strokeWidth="2" rx="2" opacity="0.4" />
                </svg>
              </div>
            </section>

            {/* Live strip */}
            <section className="strike-live-strip">
              <button type="button" className="strike-live-arrow" aria-label="Scroll left">‹</button>
              <div className="strike-live-scroll">
                <span className="strike-live-item">{t.matchesHeader}</span>
                <span className="strike-live-item">{t.tournamentsTitle}</span>
              </div>
              <span className="strike-live-countdown">{t.homeLiveCountdown}: 8H ›</span>
              <button type="button" className="strike-live-arrow" aria-label="Scroll right">›</button>
            </section>

            {/* Main: 4 cards left + Your Stats right */}
            <section className="strike-main">
              <div className="strike-cards">
                <button type="button" className="strike-card strike-card-primary" onClick={() => setActiveView('ladder')}>
                  <div className="strike-card-icon">⚡</div>
                  <h3 className="strike-card-title">{t.quickPlayTitle}</h3>
                  <p className="strike-card-text">{t.quickPlayText}</p>
                  <span className="strike-card-btn strike-btn strike-btn-primary">{t.homePlayNow}</span>
            </button>
                <button type="button" className="strike-card" onClick={() => setActiveView('tournaments')}>
                  <div className="strike-card-icon">🏆</div>
                  <h3 className="strike-card-title">{t.tournamentsTitle}</h3>
                  <p className="strike-card-text">{t.tournamentsText}</p>
                  <span className="strike-card-btn strike-btn strike-btn-outline">{t.homeViewEvents}</span>
                </button>
                <button type="button" className="strike-card" onClick={() => setActiveView('profile')}>
                  <div className="strike-card-icon">👤</div>
                  <h3 className="strike-card-title">{t.profileTileTitle}</h3>
                  <p className="strike-card-text">{t.profileTileText}</p>
                  <span className="strike-card-btn strike-btn strike-btn-outline">{t.homeViewStats}</span>
                </button>
                <button type="button" className="strike-card" onClick={() => setActiveView('rating')}>
                  <div className="strike-card-icon">📊</div>
                  <h3 className="strike-card-title">{t.ratingHeader}</h3>
                  <p className="strike-card-text">{t.ratingIntro}</p>
                  <span className="strike-card-btn strike-btn strike-btn-outline">{t.homeViewLadder}</span>
                </button>
              </div>
              <aside className="strike-stats">
                <h3 className="strike-stats-title">{t.homeYourStats}</h3>
                <div className="strike-elo-block">
                  <span className="strike-elo-label">{t.ratingElo}</span>
                  <span className="strike-elo-value">{myProfileStats?.elo ?? elo ?? '—'}</span>
                  <div className="strike-elo-bar">
                    <div
                      className="strike-elo-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((myProfileStats?.elo ?? elo ?? 1200) - 800) / 12))}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="strike-stats-row">
                  <div className="strike-stat-pill">
                    <span className="strike-stat-label">{t.ratingMatches}</span>
                    <span className="strike-stat-value">{myProfileStats?.matches_count ?? matchesCount ?? 0}</span>
                  </div>
                  <div className="strike-stat-pill">
                    <span className="strike-stat-label">{t.ratingWinRate}</span>
                    <span className="strike-stat-value strike-stat-value--success">
                      ✓ {myProfileStats?.win_rate != null ? `${myProfileStats.win_rate}%` : '0%'}
                    </span>
                  </div>
                  <div className="strike-stat-pill">
                    <span className="strike-stat-label">GF/GA</span>
                    <span className="strike-stat-value">
                      {myProfileStats ? `${myProfileStats.goals_for}/${myProfileStats.goals_against}` : '—'}
                    </span>
                  </div>
                </div>
                <h4 className="strike-recent-title">{t.profileLast10Matches}</h4>
                <ul className="strike-recent-list">
                  {myRecentMatches.length === 0 && (
                    <li className="strike-recent-empty">{t.profileRecentMatchesEmpty}</li>
                  )}
                  {myRecentMatches.slice(0, 6).map((m) => (
                    <li key={m.match_id} className={`strike-recent-item strike-recent-item--${m.result}`}>
                      <span className="strike-recent-result">{m.result === 'win' ? '✓' : m.result === 'loss' ? '✗' : '−'}</span>
                      <span className="strike-recent-opponent">{m.opponent_name ?? '—'}</span>
                      <span className="strike-recent-score">
                        {m.my_score}–{m.opp_score}
                      </span>
                      {m.elo_delta != null && m.elo_delta !== 0 && (
                        <span className="strike-recent-elo">{m.elo_delta > 0 ? `+${m.elo_delta}` : m.elo_delta}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </aside>
            </section>

            {/* Нижний ряд: слева Top Players, справа Latest News — как на фото */}
            <div className="strike-bottom">
              <section className="strike-section strike-section--top-players">
                <h3 className="strike-section-title">{t.homeTopPlayers}</h3>
                <ul className="strike-top-list">
                  {leaderboardLoading && <li className="strike-top-placeholder">{t.ratingLoading}</li>}
                  {!leaderboardLoading && leaderboard.length === 0 && (
                    <li className="strike-top-placeholder">{t.ratingEmpty}</li>
                  )}
                  {!leaderboardLoading && leaderboard.slice(0, 5).map((r, i) => (
                    <li
                      key={r.player_id}
                      className={`strike-top-item ${i === 0 ? 'strike-top-item--first' : ''}`}
                      onClick={() => {
                        setSelectedPlayerRow(r)
                        setActiveView('rating')
                      }}
                    >
                      <span className="strike-top-rank">{r.rank}</span>
                      <span className="strike-top-avatar">
                        {r.avatar_url ? (
                          <img src={r.avatar_url} alt="" width={36} height={36} />
                        ) : (
                          <span>{(r.display_name || '?').charAt(0).toUpperCase()}</span>
                        )}
                      </span>
                      <span className="strike-top-name">{r.display_name || '—'}</span>
                      <span className="strike-top-elo">ELO {r.elo ?? '—'}</span>
                      {i === 0 && <span className="strike-top-crown">👑</span>}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="strike-section strike-section--news">
                <h3 className="strike-section-title">{t.homeLatestNews}</h3>
                <div className="strike-news-grid">
                  {newsLoading && <p className="panel-text small strike-news-loading">{t.ratingLoading}</p>}
                  {!newsLoading && newsList.length === 0 && (
                    <article className="strike-news-card">
                      <div className="strike-news-thumb" />
                      <h4 className="strike-news-card-title">{t.homeNewsTitle1}</h4>
                      <p className="strike-news-card-desc">{t.homeNewsDesc1}</p>
                      <span className="strike-news-date">—</span>
                    </article>
                  )}
                  {!newsLoading && newsList.slice(0, 6).map((n) => (
                    <article
                      key={n.id}
                      className="strike-news-card strike-news-card--clickable"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedNews(n)
                        setActiveView('news-detail')
                        window.location.hash = `news=${n.id}`
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedNews(n)
                          setActiveView('news-detail')
                          window.location.hash = `news=${n.id}`
                        }
                      }}
                    >
                      <div className="strike-news-thumb">
                        {n.image_url ? <img src={n.image_url} alt="" referrerPolicy="no-referrer" /> : null}
                      </div>
                      <h4 className="strike-news-card-title">{n.title}</h4>
                      <p className="strike-news-card-desc">{n.body || '—'}</p>
                      <span className="strike-news-date">
                        {formatNewsDate(n.created_at)}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className="strike-footer">
              <div className="strike-footer-links">
                <a href="#about" className="strike-footer-link">{t.footerAbout}</a>
                <a href="#terms" className="strike-footer-link">{t.footerTerms}</a>
                <a href="#privacy" className="strike-footer-link">{t.footerPrivacy}</a>
                <a href="#contact" className="strike-footer-link">{t.footerContact}</a>
              </div>
              <div className="strike-footer-social">
                <span className="strike-social-icon" aria-label="Twitter">𝕏</span>
                <span className="strike-social-icon" aria-label="Facebook">f</span>
                <span className="strike-social-icon" aria-label="Instagram">📷</span>
                <span className="strike-social-icon" aria-label="YouTube">▶</span>
              </div>
            </footer>
          </>
        )}

        {activeView !== 'home' && (
          <h2 className="view-title">{t.viewTitle[activeView]}</h2>
        )}

        {activeView === 'news-detail' && (
          <section className="panel news-detail-panel">
            <button
              type="button"
              className="news-detail-back"
              onClick={() => { setActiveView('home'); setSelectedNews(null); window.location.hash = '' }}
            >
              ← {t.newsBack}
            </button>
            {newsDetailLoading && <p className="panel-text">{t.ratingLoading}</p>}
            {!newsDetailLoading && !selectedNews && <p className="panel-text">{t.ratingEmpty}</p>}
            {!newsDetailLoading && selectedNews && (
              <article className="news-detail-article">
                <h1 className="news-detail-title">{selectedNews.title}</h1>
                <time className="news-detail-date" dateTime={selectedNews.created_at}>
                  {formatNewsDate(selectedNews.created_at)}
                </time>
                {selectedNews.image_url && (
                  <div className="news-detail-image-wrap">
                    <img src={selectedNews.image_url} alt="" className="news-detail-image" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="news-detail-body">
                  {selectedNews.body.split('\n').map((p, i) => (
                    <p key={i}>{p || '\u00A0'}</p>
                  ))}
                </div>
              </article>
            )}
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
              <label className="form-label">Отправить одному пользователю (Telegram ID или username, опционально)</label>
              <input
                type="text"
                className="form-input"
                value={adminTargetUsername}
                onChange={(e) => setAdminTargetUsername(e.target.value)}
                placeholder="например 460758450 или @username; пусто — всем"
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

            <h3 className="panel-title admin-news-title">Новости (главная)</h3>
            <p className="panel-text small">Добавьте новость: заголовок, текст и по желанию фото. Они отображаются в блоке «Последние новости» на главной.</p>
            <div className="form-row">
              <label className="form-label">Заголовок</label>
              <input
                type="text"
                className="form-input"
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                placeholder="Заголовок новости"
              />
                    </div>
            <div className="form-row">
              <label className="form-label">Текст</label>
              <textarea
                className="form-input"
                rows={4}
                value={newsBody}
                onChange={(e) => setNewsBody(e.target.value)}
                placeholder="Краткое описание или полный текст"
              />
            </div>
            <div className="form-row">
              <label className="form-label">Фото (опционально)</label>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={(e) => setNewsImageFile(e.target.files?.[0] ?? null)}
              />
              {newsImageFile && <span className="panel-text small">Выбран файл: {newsImageFile.name}</span>}
            </div>
            {newsResult && <p className="panel-text small">{newsResult}</p>}
            <div className="admin-actions">
              <button
                type="button"
                className="primary-button"
                disabled={newsSending || !newsTitle.trim()}
                onClick={addNews}
              >
                {newsSending ? 'Добавляем…' : 'Добавить новость'}
              </button>
            </div>
            <h4 className="panel-subtitle">Опубликованные новости</h4>
            {newsLoading && <p className="panel-text small">Загрузка…</p>}
            {!newsLoading && newsList.length === 0 && <p className="panel-text small">Пока нет новостей.</p>}
            {!newsLoading && newsList.length > 0 && (
              <ul className="admin-news-list">
                {newsList.map((n) => (
                  <li key={n.id} className="admin-news-item">
                    <div className="admin-news-item-preview">
                      {n.image_url ? <img src={n.image_url} alt="" className="admin-news-item-thumb" referrerPolicy="no-referrer" /> : <span className="admin-news-item-no-thumb">нет фото</span>}
                      <div>
                        <strong>{n.title}</strong>
                        <p className="panel-text small">{n.body.slice(0, 80)}{n.body.length > 80 ? '…' : ''}</p>
                        <span className="panel-text small">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button type="button" className="admin-news-delete" onClick={() => deleteNews(n.id)}>Удалить</button>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="panel-title admin-news-title">Турниры</h3>
            <p className="panel-text small">Создайте турнир: укажите даты регистрации и проведения, длительность раунда (мин) и призовой пул (место → бонус ELO).</p>
            <div className="form-row">
              <label className="form-label">Название</label>
              <input type="text" className="form-input" value={adminTourName} onChange={(e) => setAdminTourName(e.target.value)} placeholder="Например: Кубок пятницы" />
                    </div>
            <div className="form-row form-row--inline">
              <label className="form-label">Начало регистрации</label>
              <input type="datetime-local" className="form-input" value={adminTourRegStart} onChange={(e) => setAdminTourRegStart(e.target.value)} />
                      </div>
            <div className="form-row form-row--inline">
              <label className="form-label">Конец регистрации</label>
              <input type="datetime-local" className="form-input" value={adminTourRegEnd} onChange={(e) => setAdminTourRegEnd(e.target.value)} />
                      </div>
            <div className="form-row form-row--inline">
              <label className="form-label">Старт турнира</label>
              <input type="datetime-local" className="form-input" value={adminTourStart} onChange={(e) => setAdminTourStart(e.target.value)} />
                      </div>
            <div className="form-row form-row--inline">
              <label className="form-label">Конец турнира</label>
              <input type="datetime-local" className="form-input" value={adminTourEnd} onChange={(e) => setAdminTourEnd(e.target.value)} />
                      </div>
            <div className="form-row">
              <label className="form-label">Длительность раунда (минут)</label>
              <input type="number" min={5} className="form-input" style={{ maxWidth: '120px' }} value={adminTourRoundMins} onChange={(e) => setAdminTourRoundMins(e.target.value)} />
                      </div>
            <div className="form-row">
              <label className="form-label">Призовой пул (место → ELO)</label>
              <div className="admin-prize-pool">
                {adminTourPrizePool.map((p, i) => (
                  <div key={i} className="admin-prize-row">
                    <span>Место</span>
                    <input type="number" min={1} className="form-input" style={{ width: '56px' }} value={p.place} onChange={(e) => setAdminTourPrizePool((prev) => prev.map((x, j) => j === i ? { ...x, place: parseInt(e.target.value, 10) || 1 } : x))} />
                    <span>ELO</span>
                    <input type="number" min={0} className="form-input" style={{ width: '64px' }} value={p.elo_bonus} onChange={(e) => setAdminTourPrizePool((prev) => prev.map((x, j) => j === i ? { ...x, elo_bonus: parseInt(e.target.value, 10) || 0 } : x))} />
                    <button type="button" className="strike-btn strike-btn-secondary" onClick={() => setAdminTourPrizePool((prev) => prev.filter((_, j) => j !== i))}>−</button>
                      </div>
                ))}
                <button type="button" className="strike-btn strike-btn-secondary" onClick={() => setAdminTourPrizePool((prev) => [...prev, { place: prev.length + 1, elo_bonus: 0 }])}>+ Добавить место</button>
                      </div>
                    </div>
            {adminTourResult && <p className="panel-text small">{adminTourResult}</p>}
            <div className="admin-actions">
              <button type="button" className="primary-button" disabled={adminTourSending || !adminTourName.trim()} onClick={createTournament}>
                {adminTourSending ? 'Создаём…' : 'Создать турнир'}
              </button>
            </div>
            <h4 className="panel-subtitle">Список турниров (админ)</h4>
            {tournamentsLoading && <p className="panel-text small">Загрузка…</p>}
            {!tournamentsLoading && tournamentsList.length === 0 && <p className="panel-text small">Турниров пока нет.</p>}
            {!tournamentsLoading && tournamentsList.length > 0 && (
              <ul className="admin-news-list">
                {tournamentsList.map((t) => (
                  <li key={t.id} className="admin-news-item">
                    <div>
                      <strong>{t.name}</strong>
                      <span className="panel-text small"> — {t.status}</span>
                      <p className="panel-text small">Рег.: {new Date(t.registration_start).toLocaleString()} – {new Date(t.registration_end).toLocaleString()} | Участников: {t.registrations_count}</p>
                    </div>
                    <div className="admin-actions" style={{ flexDirection: 'row', gap: 8 }}>
                      {t.status === 'registration' && (
                        <button type="button" className="strike-btn strike-btn-secondary" onClick={() => tournamentStartBracket(t.id)}>Старт сетки</button>
                      )}
                      <button type="button" className="strike-btn strike-btn-secondary" onClick={() => tournamentTick(t.id)}>Обновить по времени</button>
                      <button type="button" className="strike-btn" style={{ color: 'var(--error)' }} onClick={() => deleteTournament(t.id)}>Удалить</button>
                    </div>
                          </li>
                        ))}
                      </ul>
                    )}
          </section>
        )}

        {activeView === 'rating' && (
          <section className="panel rating-panel">
            <div className="rating-layout">
              <div className="rating-leaderboard">
                <h3 className="rating-title">{t.ratingHeader}</h3>
                <p className="panel-text small rating-subtitle">{t.ratingIntro}</p>
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
                          <th>{t.profileCountry}</th>
                          <th>{t.ratingElo}</th>
                          <th>{t.ratingMatches}</th>
                          <th>{t.ratingWinRate}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((r) => (
                          <tr
                            key={r.player_id}
                            className={`rating-row-clickable ${selectedPlayerRow?.player_id === r.player_id ? 'rating-row--active' : ''}`}
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
                            <td className="rating-country-cell">
                              {r.country_code ? (COUNTRIES.find((c) => c.code === r.country_code)?.flag ?? r.country_code) : '—'}
                            </td>
                            <td className="rating-elo-cell">{r.elo ?? '—'}</td>
                            <td>{r.matches_count}</td>
                            <td className="rating-winrate-cell">{r.win_rate != null ? `${r.win_rate}%` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* На мобильных модалка рендерится в body через Portal — поверх футера */}
              {!isWideScreen && selectedPlayerRow && createPortal(
                <div className="app strike-theme" style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
                  <aside
                    className="rating-details rating-details--has-player rating-details--portal"
                    style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedPlayerRow(null) }}
                  >
                    <div className="rating-details-close-wrap">
                      <button
                        type="button"
                        className="rating-details-close"
                        onClick={(e) => { e.stopPropagation(); setSelectedPlayerRow(null) }}
                        aria-label={t.ratingBack}
                      >
                        ×
                      </button>
                    </div>
                    <div className="rating-details-inner" onClick={(e) => e.stopPropagation()}>
                      <div className="rating-details-header">
                        <div className="rating-details-name-row">
                          <h2 className="rating-player-heading">{selectedPlayerRow.display_name ?? '—'}</h2>
                          {selectedPlayerRow.country_code && (
                            <span className="rating-player-country">
                              {COUNTRIES.find((c) => c.code === selectedPlayerRow.country_code)?.flag ?? '🌐'}
                            </span>
                          )}
                        </div>
                        <div className="rating-elo-block-big">
                          <span className="rating-elo-label-small">{t.ratingElo}</span>
                          <span className="rating-elo-big">{selectedPlayerRow.elo ?? '—'}</span>
                          <div className="rating-rank-chip">
                            {(() => {
                              const rank = getRankFromElo(selectedPlayerRow.elo ?? null)
                              return getRankDisplayLabel(rank)
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="rating-stats-grid">
                        <div className="rating-stat-card">
                          <span className="rating-stat-label">{t.ratingMatches}</span>
                          <span className="rating-stat-value">{selectedPlayerRow.matches_count}</span>
                        </div>
                        <div className="rating-stat-card">
                          <span className="rating-stat-label">{t.ratingWins}</span>
                          <span className="rating-stat-value">{selectedPlayerRow.wins}</span>
                        </div>
                        <div className="rating-stat-card">
                          <span className="rating-stat-label">{t.ratingLosses}</span>
                          <span className="rating-stat-value">{selectedPlayerRow.losses}</span>
                        </div>
                        <div className="rating-stat-card">
                          <span className="rating-stat-label">GF/GA</span>
                          <span className="rating-stat-value">
                            {selectedPlayerRow.goals_for}/{selectedPlayerRow.goals_against}
                          </span>
                        </div>
                        <div className="rating-stat-card rating-stat-card-accent">
                          <span className="rating-stat-label">{t.ratingWinRate}</span>
                          <span className="rating-stat-value">
                            {selectedPlayerRow.win_rate != null ? `${selectedPlayerRow.win_rate}%` : '—'}
                          </span>
                        </div>
                      </div>
                      <h4 className="rating-last-title">{t.profileLast10Matches}</h4>
                      {recentMatchesLoading && <p className="panel-text small">…</p>}
                      {!recentMatchesLoading && recentMatches.length === 0 && (
                        <p className="panel-text small">{t.profileRecentMatchesEmpty}</p>
                      )}
                      {!recentMatchesLoading && recentMatches.length > 0 && (
                        <div className="profile-recent-table-wrap rating-last-table">
                          <table className="profile-recent-table">
                            <thead>
                              <tr>
                                <th>{t.profilePlayerLabel}</th>
                                <th>{t.profileTableScore}</th>
                                <th>{t.profileTableResult}</th>
                                <th>{t.profileTableElo}</th>
                                <th>{t.profileTableDate}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recentMatches.slice(0, 5).map((match) => (
                                <tr key={match.match_id} className={`profile-recent-match profile-recent-match--${match.result}`}>
                                  <td className="profile-recent-opponent">{match.opponent_name ?? '—'}</td>
                                  <td className="profile-recent-score">
                                    {match.my_score}:{match.opp_score}
                                  </td>
                                  <td>
                                    <span className={`profile-result-pill profile-result-pill--${match.result}`}>
                                      {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'}
                                    </span>
                                  </td>
                                  <td className="profile-recent-elo-cell">
                                    {typeof match.elo_delta === 'number' && match.elo_delta !== 0 ? (
                                      <>
                                        {match.elo_delta > 0 ? <IconEloUpSvg /> : <IconEloDownSvg />}
                                        <span className="profile-recent-elo-delta">
                                          {match.elo_delta > 0 ? `+${match.elo_delta}` : match.elo_delta}
                                        </span>
                                      </>
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                  <td className="profile-recent-date">
                                    {match.played_at
                                      ? new Date(match.played_at).toLocaleDateString(undefined, {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                        })
                                      : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </aside>
                </div>,
                document.body
              )}

              {(isWideScreen || !selectedPlayerRow) && (
                <aside
                  className={`rating-details ${selectedPlayerRow ? 'rating-details--has-player' : ''}`}
                  onClick={selectedPlayerRow ? (e) => { if (e.target === e.currentTarget && window.innerWidth <= 1023) setSelectedPlayerRow(null) } : undefined}
                >
                  {selectedPlayerRow && (
                    <div className="rating-details-close-wrap">
                      <button
                        type="button"
                        className="rating-details-close"
                        onClick={(e) => { e.stopPropagation(); setSelectedPlayerRow(null) }}
                        aria-label={t.ratingBack}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <div className="rating-details-inner" onClick={selectedPlayerRow ? (e) => e.stopPropagation() : undefined}>
                  {profileFromHashLoading && !selectedPlayerRow && (
                    <p className="panel-text small">{t.ratingLoading}</p>
                  )}
                  {selectedPlayerRow ? (
                    <>
                      <div className="rating-details-header">
                        <div className="rating-details-name-row">
                          <h2 className="rating-player-heading">{selectedPlayerRow.display_name ?? '—'}</h2>
                          {selectedPlayerRow.country_code && (
                            <span className="rating-player-country">
                              {COUNTRIES.find((c) => c.code === selectedPlayerRow.country_code)?.flag ?? '🌐'}
                            </span>
                          )}
                        </div>
                        <div className="rating-elo-block-big">
                          <span className="rating-elo-label-small">{t.ratingElo}</span>
                          <span className="rating-elo-big">{selectedPlayerRow.elo ?? '—'}</span>
                          <div className="rating-rank-chip">
                            {(() => {
                              const rank = getRankFromElo(selectedPlayerRow.elo ?? null)
                              return getRankDisplayLabel(rank)
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="rating-stats-grid">
                        <div className="rating-stat-card">
                          <span className="rating-stat-label">{t.ratingMatches}</span>
                          <span className="rating-stat-value">{selectedPlayerRow.matches_count}</span>
                        </div>
                        <div className="rating-stat-card">
                          <span className="rating-stat-label">{t.ratingWins}</span>
                          <span className="rating-stat-value">{selectedPlayerRow.wins}</span>
                        </div>
                        <div className="rating-stat-card">
                          <span className="rating-stat-label">{t.ratingLosses}</span>
                          <span className="rating-stat-value">{selectedPlayerRow.losses}</span>
                        </div>
                        <div className="rating-stat-card">
                          <span className="rating-stat-label">GF/GA</span>
                          <span className="rating-stat-value">
                            {selectedPlayerRow.goals_for}/{selectedPlayerRow.goals_against}
                          </span>
                        </div>
                        <div className="rating-stat-card rating-stat-card-accent">
                          <span className="rating-stat-label">{t.ratingWinRate}</span>
                          <span className="rating-stat-value">
                            {selectedPlayerRow.win_rate != null ? `${selectedPlayerRow.win_rate}%` : '—'}
                          </span>
                        </div>
                      </div>

                      <h4 className="rating-last-title">{t.profileLast10Matches}</h4>
                      {recentMatchesLoading && <p className="panel-text small">…</p>}
                      {!recentMatchesLoading && recentMatches.length === 0 && (
                        <p className="panel-text small">{t.profileRecentMatchesEmpty}</p>
                      )}
                      {!recentMatchesLoading && recentMatches.length > 0 && (
                        <div className="profile-recent-table-wrap rating-last-table">
                          <table className="profile-recent-table">
                            <thead>
                              <tr>
                                <th>{t.profilePlayerLabel}</th>
                                <th>{t.profileTableScore}</th>
                                <th>{t.profileTableResult}</th>
                                <th>{t.profileTableElo}</th>
                                <th>{t.profileTableDate}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recentMatches.slice(0, 5).map((match) => (
                                <tr key={match.match_id} className={`profile-recent-match profile-recent-match--${match.result}`}>
                                  <td className="profile-recent-opponent">{match.opponent_name ?? '—'}</td>
                                  <td className="profile-recent-score">
                                    {match.my_score}:{match.opp_score}
                                  </td>
                                  <td>
                                    <span className={`profile-result-pill profile-result-pill--${match.result}`}>
                                      {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'}
                                    </span>
                                  </td>
                                  <td className="profile-recent-elo-cell">
                                    {typeof match.elo_delta === 'number' && match.elo_delta !== 0 ? (
                                      <>
                                        {match.elo_delta > 0 ? <IconEloUpSvg /> : <IconEloDownSvg />}
                                        <span className="profile-recent-elo-delta">
                                          {match.elo_delta > 0 ? `+${match.elo_delta}` : match.elo_delta}
                                        </span>
                                      </>
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                  <td className="profile-recent-date">
                                    {match.played_at
                                      ? new Date(match.played_at).toLocaleDateString(undefined, {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                        })
                                      : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="panel-text small rating-details-placeholder">
                      {t.ratingEmptySelectedPlayer ?? 'Select a player on the left to see details.'}
                    </p>
                  )}
                  </div>
                </aside>
              )}
            </div>
          </section>
        )}

        {activeView === 'profile' && (
          <section className="panel profile-panel">
            <h3 className="panel-title profile-panel-title">{t.profileHeader}</h3>
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
                        {/* Табы профиля */}
                        <div className="profile-tabs">
                          <button
                            type="button"
                            className={`profile-tab ${profileActiveTab === 'overview' ? 'profile-tab--active' : ''}`}
                            onClick={() => setProfileActiveTab('overview')}
                          >
                            {t.profileTabOverview}
                          </button>
                          <button
                            type="button"
                            className={`profile-tab ${profileActiveTab === 'edit' ? 'profile-tab--active' : ''}`}
                            onClick={() => setProfileActiveTab('edit')}
                          >
                            {t.profileTabEdit}
                          </button>
                          <button
                            type="button"
                            className={`profile-tab ${profileActiveTab === 'settings' ? 'profile-tab--active' : ''}`}
                            onClick={() => setProfileActiveTab('settings')}
                          >
                            {t.profileTabSettings}
                          </button>
                        </div>

                        {/* Контент табов */}
                        <div className="profile-tab-content">
                          {profileActiveTab === 'overview' && (
                            <div className="profile-tab-panel">
                              <div className="profile-rank-card profile-rank-card--ref">
                                <div className="profile-rank-card-left">
                                  <div className="profile-rank-badge-wrap">
                                    <ProfileRankBadgeSvg />
                                  </div>
                                  <span className="profile-rank-level profile-rank-level--label">
                                    {(myProfileStats?.matches_count ?? matchesCount ?? 0) <= 10
                                      ? t.profileCalibrationLabel
                                      : getRankDisplayLabel(getRankFromElo(myProfileStats?.elo ?? elo ?? null))}
              </span>
            </div>
                                <div className="profile-rank-card-right">
                                  <span className="profile-elo-big">{myProfileStats?.elo ?? elo ?? '—'} ELO</span>
                                  <p className="profile-rank-meta">{t.profileEloLabel}</p>
                                  <p className="profile-matches-summary">
                                    {t.profileMatchesLabel}: {(myProfileStats?.matches_count ?? matchesCount ?? 0).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {myProfileStats && (
                                <>
                                  <h4 className="profile-stats-heading">{t.profileStatsSummary}</h4>
                                  <div className="profile-stats-grid">
                                    <div className="profile-stat-card">
                                      <span className="profile-stat-icon-wrap"><IconMatchesSvg /></span>
                                      <span className="profile-stat-value">{myProfileStats.matches_count}</span>
                                      <span className="profile-stat-label">{t.ratingMatches}</span>
                                    </div>
                                    <div className="profile-stat-card">
                                      <span className="profile-stat-icon-wrap"><IconWinsSvg /></span>
                                      <span className="profile-stat-value">{myProfileStats.wins}</span>
                                      <span className="profile-stat-label">{t.ratingWins}</span>
                                    </div>
                                    <div className="profile-stat-card">
                                      <span className="profile-stat-icon-wrap"><IconDrawsSvg /></span>
                                      <span className="profile-stat-value">{myProfileStats.draws}</span>
                                      <span className="profile-stat-label">{t.ratingDraws}</span>
                                    </div>
                                    <div className="profile-stat-card">
                                      <span className="profile-stat-icon-wrap"><IconLossesSvg /></span>
                                      <span className="profile-stat-value">{myProfileStats.losses}</span>
                                      <span className="profile-stat-label">{t.ratingLosses}</span>
                                    </div>
                                    <div className="profile-stat-card">
                                      <span className="profile-stat-icon-wrap"><IconGoalsSvg /></span>
                                      <span className="profile-stat-value">{myProfileStats.goals_for} / {myProfileStats.goals_against}</span>
                                      <span className="profile-stat-label">{t.ratingGoalsFor} / {t.ratingGoalsAgainst}</span>
                                    </div>
                                    <div className="profile-stat-card profile-stat-card-accent">
                                      <span className="profile-stat-icon-wrap"><IconWinRateSvg /></span>
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
                                    <div className="profile-recent-table-wrap">
                                      <table className="profile-recent-table">
                                        <thead>
                                          <tr>
                                            <th>{t.profilePlayerLabel}</th>
                                            <th>{t.profileTableScore}</th>
                                            <th>{t.profileTableResult}</th>
                                            <th>{t.profileTableElo}</th>
                                            <th>{t.profileTableDate}</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {myRecentMatches.map((match) => (
                                            <tr key={match.match_id} className={`profile-recent-match profile-recent-match--${match.result}`}>
                                              <td className="profile-recent-opponent">{match.opponent_name ?? '—'}</td>
                                              <td className="profile-recent-score">{match.my_score}:{match.opp_score}</td>
                                              <td>
                                                <span className={`profile-result-pill profile-result-pill--${match.result}`}>
                                                  {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'}
                                                </span>
                                              </td>
                                              <td className="profile-recent-elo-cell">
                                                {typeof match.elo_delta === 'number' && match.elo_delta !== 0 ? (
                                                  <>
                                                    {match.elo_delta > 0 ? <IconEloUpSvg /> : <IconEloDownSvg />}
                                                    <span className="profile-recent-elo-delta">
                                                      {match.elo_delta > 0 ? `+${match.elo_delta}` : match.elo_delta}
                                                    </span>
                                                  </>
                                                ) : (
                                                  '—'
                                                )}
                                              </td>
                                              <td className="profile-recent-date">
                                                {match.played_at
                                                  ? new Date(match.played_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })
                                                  : '—'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {profileActiveTab === 'edit' && (
                            <div className="profile-tab-panel">
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
              </div>
            )}

                          {profileActiveTab === 'settings' && (
                            <div className="profile-tab-panel">
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
                            </div>
                          )}
                        </div>
                      </div>
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
            {tournamentsLoading && <p className="panel-text small">{t.profileLoading}</p>}
            {!tournamentsLoading && tournamentsList.length === 0 && <p className="panel-text small">Турниров пока нет.</p>}
            {!tournamentsLoading && tournamentsList.length > 0 && (
              <div className="tournaments-list">
                {tournamentsList.map((tr) => {
                  const isRegistered = tournamentRegistrations.has(tr.id)
                  const now = new Date().getTime()
                  const regStart = new Date(tr.registration_start).getTime()
                  const regEnd = new Date(tr.registration_end).getTime()
                  const canRegister = tr.status === 'registration' && playerId && now >= regStart && now < regEnd
                  return (
                    <div key={tr.id} className="strike-card tournament-card">
                      <div className="tournament-card-main">
                        <h4 className="tournament-card-name">{tr.name}</h4>
                        <p className="panel-text small">
                          Регистрация: {new Date(tr.registration_start).toLocaleString()} – {new Date(tr.registration_end).toLocaleString()}
                          <br />
                          Турнир: {new Date(tr.tournament_start).toLocaleString()} – {new Date(tr.tournament_end).toLocaleString()}
                        </p>
                        <p className="panel-text small">Статус: {tr.status} · Участников: {tr.registrations_count}</p>
                        <div className="tournament-card-actions">
                          {canRegister && !isRegistered && (
                            <button type="button" className="strike-btn strike-btn-primary" onClick={() => tournamentRegister(tr.id)}>Зарегистрироваться</button>
                          )}
                          {canRegister && isRegistered && (
                            <button type="button" className="strike-btn strike-btn-secondary" onClick={() => tournamentUnregister(tr.id)}>Отменить регистрацию</button>
                          )}
                          {(tr.status === 'ongoing' || tr.status === 'finished') && (
                            <button type="button" className="strike-btn strike-btn-secondary" onClick={() => setSelectedTournamentId(selectedTournamentId === tr.id ? null : tr.id)}>
                              {selectedTournamentId === tr.id ? 'Скрыть сетку' : 'Сетка'}
                            </button>
                          )}
                        </div>
                      </div>
                      {selectedTournamentId === tr.id && (tr.status === 'ongoing' || tr.status === 'finished') && (
                        <TournamentBracketBlock
                          tournament={tr}
                          matches={tournamentMatches}
                          playerId={playerId}
                          leaderboard={leaderboard}
                          onRefresh={async () => {
                            fetchTournaments()
                            const { data } = await supabase.from('tournament_matches').select('*').eq('tournament_id', tr.id).order('round', { ascending: false }).order('match_index')
                            if (data) setTournamentMatches(data as TournamentMatchRow[])
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <p className="panel-hint">{t.tournamentsHint}</p>
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
