import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'

type View = 'home' | 'profile' | 'ladder' | 'tournaments' | 'matches' | 'rating'
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
    profileTelegramNewTab: string
    profileTelegramSameTab: string
    profileTelegramReturnedNoParams: string
    profileTelegramChatOnly: string
    profileTelegramMenuHint: string
    profileTelegramStep2: string
    profileTelegramBotfatherHint: string
    profileTelegramSetDomain: string
    profileTelegramSetDomainOne: string
    profileTelegramBotIdHint: string
    profileTelegramNoRedirect: string
    profileLogout: string
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
    ladderMessageOpponent: string
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
    ladderProfileLoading: string
    ladderProfileNotReady: string
    ladderTwoPlayersHint: string
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
    playerProfileTitle: string
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
    profileTelegramNewTab: 'Opens in a new tab. After login you\'ll return to the site there; then refresh this page or use that tab.',
    profileTelegramSameTab: 'After clicking you\'ll go to Telegram to log in, then return here. If you still see Guest after returning, add this domain in BotFather: /setdomain',
    profileTelegramReturnedNoParams: 'You seem to have returned from Telegram but the domain was not in the allowed list. In BotFather run /setdomain, select your bot, and add this domain:',
    profileTelegramChatOnly: 'If the blue button only opens the bot chat and you don\'t see "Allow to log you in?", run /setdomain in BotFather and add your site domain (see below).',
    profileTelegramMenuHint: 'In the bot chat, tap the menu button (☰) or the button below the input to open the app.',
    profileTelegramStep2: 'If only the chat opened: tap the menu button (☰) next to the input, or the button below the input (e.g. "FC Area") to open the app.',
    profileTelegramBotfatherHint: 'If there is no app button: in BotFather run /setmenubutton, select your bot, choose "Web App", enter URL (e.g. https://www.fcarea.com) and button name (e.g. FC Area).',
    profileTelegramSetDomain: 'If you still appear as a guest after logging in: in BotFather run /setdomain, select your bot, and add your site domain (e.g. www.fcarea.com).',
    profileTelegramSetDomainOne: 'If still Guest after login: in BotFather run /setdomain and add this domain:',
    profileTelegramBotIdHint: 'If no blue button appears: add VITE_TELEGRAM_BOT_ID to your site env (from BotFather token, the part before \':\') and redeploy.',
    profileTelegramNoRedirect: 'If Telegram does not redirect you back to the site: in BotFather run /setdomain, select your bot, and add this domain:',
    profileLogout: 'Log out',
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
    ladderMessageOpponent: 'Message opponent in Telegram',
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
    ladderProfileLoading: 'Loading profile…',
    ladderProfileNotReady: 'Profile not ready. Open the Profile tab and wait for it to load, or log in again.',
    ladderTwoPlayersHint: 'Two different players must press Search at the same time (e.g. two devices or two accounts).',
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
    playerProfileTitle: 'Player profile',
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
    profileTelegramNewTab: 'Se deschide într-un tab nou. După login vei reveni pe site acolo; reîmprospătează această pagină sau folosește acel tab.',
    profileTelegramSameTab: 'După click vei merge pe Telegram pentru login, apoi vei reveni aici. Dacă tot vezi „oaspete”, adaugă domeniul în BotFather: /setdomain',
    profileTelegramReturnedNoParams: 'Pare că ai revenit de pe Telegram, dar domeniul nu era în listă. În BotFather rulează /setdomain, selectează botul și adaugă acest domeniu:',
    profileTelegramChatOnly: 'Dacă butonul albastru deschide doar chat-ul cu botul și nu vezi "Allow to log you in?", rulează /setdomain în BotFather și adaugă domeniul site-ului (vezi mai jos).',
    profileTelegramMenuHint: 'În chat cu botul, apasă butonul de meniu (☰) sau butonul de sub input pentru a deschide aplicația.',
    profileTelegramStep2: 'Dacă s-a deschis doar chat-ul: apasă butonul de meniu (☰) lângă câmpul de input sau butonul de sub input (ex. "FC Area") pentru a deschide aplicația.',
    profileTelegramBotfatherHint: 'Dacă nu există buton pentru aplicație: în BotFather rulează /setmenubutton, selectează botul, alege "Web App", introdu URL (ex. https://www.fcarea.com) și numele butonului (ex. FC Area).',
    profileTelegramSetDomain: 'Dacă rămâi "oaspete" după login: în BotFather rulează /setdomain, selectează botul și adaugă domeniul site-ului (ex. www.fcarea.com).',
    profileTelegramSetDomainOne: 'Dacă tot vezi „oaspete” după login: în BotFather rulează /setdomain și adaugă domeniul:',
    profileTelegramBotIdHint: 'Dacă nu apare butonul albastru: adaugă VITE_TELEGRAM_BOT_ID în env (din tokenul BotFather, partea înainte de \':\') și redeploy.',
    profileTelegramNoRedirect: 'Dacă Telegram nu te redirecționează înapoi pe site: în BotFather rulează /setdomain, selectează botul și adaugă acest domeniu:',
    profileLogout: 'Deconectare',
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
    ladderMessageOpponent: 'Scrie adversarului în Telegram',
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
    ladderProfileLoading: 'Se încarcă profilul…',
    ladderProfileNotReady: 'Profilul nu e gata. Deschide tab-ul Profil și așteaptă încărcarea sau autentifică-te din nou.',
    ladderTwoPlayersHint: 'Doi jucători diferiți trebuie să apese Caută în același timp (ex. două dispozitive sau două conturi).',
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
    playerProfileTitle: 'Profil jucător',
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
    profileTelegramNewTab: 'Откроется в новой вкладке. После входа вы вернётесь на сайт там; обновите эту страницу или работайте в той вкладке.',
    profileTelegramSameTab: 'После нажатия вы перейдёте в Telegram для входа, затем вернётесь сюда. Если после возврата всё ещё «Гость» — добавьте этот домен в BotFather: /setdomain',
    profileTelegramReturnedNoParams: 'Похоже, вы вернулись из Telegram, но домен не был в списке разрешённых. В BotFather выполните /setdomain, выберите бота и добавьте этот домен:',
    profileTelegramChatOnly: 'Если при нажатии синей кнопки открывается только чат с ботом и нет окна «Разрешить вход?» — в BotFather выполните /setdomain и добавьте домен сайта (см. ниже).',
    profileTelegramMenuHint: 'В чате с ботом нажмите кнопку меню (☰) или кнопку под полем ввода, чтобы открыть приложение.',
    profileTelegramStep2: 'Если открылся только чат: нажмите кнопку меню (☰) слева от поля ввода или кнопку под полем ввода (например «FC Area») — откроется приложение.',
    profileTelegramBotfatherHint: 'Если такой кнопки нет: в BotFather выполните /setmenubutton → выберите бота → Web App → укажите URL (например https://www.fcarea.com) и название кнопки (например FC Area).',
    profileTelegramSetDomain: 'Если после входа всё равно показывается «Гость»: в BotFather выполните /setdomain, выберите бота и добавьте домен сайта (например www.fcarea.com).',
    profileTelegramSetDomainOne: 'Если после входа всё ещё «Гость»: в BotFather выполните /setdomain и добавьте домен:',
    profileTelegramBotIdHint: 'Если синяя кнопка не появляется: добавьте VITE_TELEGRAM_BOT_ID в переменные окружения сайта (из токена BotFather — часть до двоеточия) и пересоберите.',
    profileTelegramNoRedirect: 'Если Telegram не возвращает на сайт после входа: в BotFather выполните /setdomain, выберите бота и добавьте этот домен:',
    profileLogout: 'Выйти',
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
    ladderMessageOpponent: 'Написать сопернику в Telegram',
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
    ladderProfileLoading: 'Загрузка профиля…',
    ladderProfileNotReady: 'Профиль не загружен. Откройте вкладку «Профиль» и дождитесь загрузки или войдите снова.',
    ladderTwoPlayersHint: 'Два разных игрока должны нажать «Поиск» одновременно (например, с двух устройств или двух аккаунтов).',
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
    playerProfileTitle: 'Профиль игрока',
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

/** Парсит сырую строку initData (query_id=...&user=%7B...%7D&auth_date=...&hash=...). */
function parseInitDataString(initData: string): TelegramUser | null {
  if (!initData?.trim()) return null
  try {
    const params = new URLSearchParams(initData)
    const userStr = params.get('user')
    if (!userStr) return null
    const raw = decodeURIComponent(userStr)
    const data = JSON.parse(raw) as {
      id?: number
      first_name?: string
      last_name?: string
      username?: string
    }
    if (typeof data.id !== 'number' || typeof data.first_name !== 'string') return null
    return {
      id: data.id,
      first_name: data.first_name.trim(),
      last_name: data.last_name?.trim() || undefined,
      username: data.username?.trim() || undefined,
    }
  } catch {
    return null
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string
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
  const [opponentUsername, setOpponentUsername] = useState<string | null>(null)
  const [scoreA, setScoreA] = useState<string>('')
  const [scoreB, setScoreB] = useState<string>('')
  const [savingMatch, setSavingMatch] = useState(false)
  const [matchMessage, setMatchMessage] = useState<string | null>(null)
  const [allMatches, setAllMatches] = useState<Array<{ match_id: number; player_a_name: string; player_b_name: string; score_a: number; score_b: number; result: string; played_at: string | null }>>([])
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
  const [profileSaveLoading, setProfileSaveLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null)
  type RecentMatchRow = { match_id: number; opponent_name: string | null; my_score: number; opp_score: number; result: string; played_at: string | null }
  const [recentMatches, setRecentMatches] = useState<RecentMatchRow[]>([])
  const [recentMatchesLoading, setRecentMatchesLoading] = useState(false)
  const widgetContainerRef = useRef<HTMLDivElement>(null)

  const tg = window.Telegram?.WebApp
  
  // Парсим редирект один раз при загрузке (до первого рендера)
  const parsedRedirectRef = useRef<TelegramUser | null>(null)
  if (parsedRedirectRef.current === null) {
    const parsed = parseWidgetRedirect()
    if (parsed) {
      console.log('[FC Area] Parsed Telegram redirect:', parsed)
      // Сохраняем в localStorage сразу
      try {
        localStorage.setItem(WIDGET_USER_KEY, JSON.stringify(parsed))
        console.log('[FC Area] Saved to localStorage')
      } catch (e) {
        console.error('[FC Area] Failed to save to localStorage:', e)
      }
      parsedRedirectRef.current = parsed
    } else {
      const hash = window.location.hash?.slice(1)
      const search = window.location.search?.slice(1)
      // Не логируем ошибку если tgAuthResult=false (нормально для Mini App)
      const hasTgAuthResult = hash?.includes('tgAuthResult=') || search?.includes('tgAuthResult=')
      if (hasTgAuthResult) {
        const params = new URLSearchParams(hash || search || '')
        const tgAuthResult = params.get('tgAuthResult')
        if (tgAuthResult) {
          try {
            const decoded = atob(tgAuthResult)
            if (decoded === 'false') {
              console.log('[FC Area] tgAuthResult=false (auth cancelled or failed), will use tg.initDataUnsafe?.user')
            } else {
              console.log('[FC Area] tgAuthResult present but invalid:', tgAuthResult)
            }
          } catch (_) {
            console.log('[FC Area] tgAuthResult present but not base64:', tgAuthResult)
          }
        }
      }
    }
  }
  
  const [widgetUser, setWidgetUser] = useState<TelegramUser | null>(() => {
    return parsedRedirectRef.current || getStoredWidgetUser()
  })
  const [cameFromTelegram, setCameFromTelegram] = useState(false)

  useEffect(() => {
    if (!tg) return
    tg.ready()
    tg.expand()
    // Пользователь: initDataUnsafe.user или парсим сырую строку initData (если unsafe пуст)
    const applyUser = (u: TelegramUser) => {
      if (widgetUser) return
      console.log('[FC Area] Found user from tg:', u)
      setWidgetUser(u)
      try {
        localStorage.setItem(WIDGET_USER_KEY, JSON.stringify(u))
      } catch (e) {
        console.error('[FC Area] Failed to save tg user to localStorage:', e)
      }
    }
    const checkUser = () => {
      if (tg.initDataUnsafe?.user) {
        applyUser(tg.initDataUnsafe.user)
        return
      }
      if (tg.initData) {
        const parsed = parseInitDataString(tg.initData)
        if (parsed) applyUser(parsed)
      }
    }
    checkUser()
    const timeoutId = setTimeout(checkUser, 150)
    return () => clearTimeout(timeoutId)
  }, [tg, widgetUser])

  // Если был редирект — очищаем URL/sessionStorage и переключаемся на профиль
  useEffect(() => {
    if (parsedRedirectRef.current) {
      setWidgetUser(parsedRedirectRef.current)
      setActiveView('profile')
      setCameFromTelegram(false)
      try {
        sessionStorage.removeItem(TG_REDIRECT_KEY)
      } catch (_) {}
      window.history.replaceState(null, '', window.location.pathname)
      // Очищаем ref чтобы не обрабатывать повторно
      parsedRedirectRef.current = null
    } else if (
      typeof document !== 'undefined' &&
      document.referrer &&
      document.referrer.includes('telegram') &&
      !window.location.hash &&
      !window.location.search
    ) {
      setCameFromTelegram(true)
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

  // Виджет «Войти через Telegram» — показываем только если нет прямой ссылки (Bot ID), иначе виджет может вызывать перезагрузку
  const showWidget = !tg && !widgetUser && activeView === 'profile' && !telegramLoginUrl
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
  
  // Отладка: логируем состояние пользователя
  useEffect(() => {
    if (user) {
      console.log('[FC Area] User set:', { id: user.id, username: user.username, from: tg ? 'WebApp' : 'widget' })
    } else {
      console.log('[FC Area] No user. tg:', !!tg, 'widgetUser:', widgetUser)
    }
  }, [user, tg, widgetUser])

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
      const u = upserted as { avatar_url?: string | null; country_code?: string | null }
      setMyAvatarUrl(u?.avatar_url ?? '')
      setMyCountryCode(u?.country_code ?? '')

      // считаем подтверждённые матчи через RPC (UUID в теле — без 400)
      const { data: count, error: countErr } = await supabase.rpc('get_my_matches_count', { p_player_id: upserted.id })
      if (!countErr && count != null) setMatchesCount(Number(count))

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
        const { data: opp } = await supabase.from('players').select('username, first_name, last_name').eq('id', oppId).single()
        const name = opp ? (opp.username ? `@${opp.username}` : [opp.first_name, opp.last_name].filter(Boolean).join(' ') || t.guestName) : t.guestName
        setOpponentName(name)
        setOpponentUsername(opp?.username ?? null)
        setSearchStatus('in_lobby')
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
    const { data: opp } = await supabase.from('players').select('username, first_name, last_name').eq('id', oppId).single()
    const name = opp ? (opp.username ? `@${opp.username}` : [opp.first_name, opp.last_name].filter(Boolean).join(' ') || t.guestName) : t.guestName
    setOpponentName(name)
    setOpponentUsername(opp?.username ?? null)
    setSearchStatus('in_lobby')
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
          const row = payload.new as { id: number; player_a_id: string; player_b_id: string; score_a?: number | null; score_b?: number | null; score_submitted_by?: string | null }
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
  }, [searchStatus, currentMatch?.id])

  // Опрос (fallback) в лобби: обновляем данные матча (счёт, score_submitted_by), если соперник ввёл счёт, а Realtime не сработал
  useEffect(() => {
    if (searchStatus !== 'in_lobby' || !playerId || !currentMatch?.id) return
    const interval = setInterval(async () => {
      const { data: rows, error } = await supabase.rpc('get_my_pending_match', { p_player_id: playerId })
      const data = Array.isArray(rows) ? rows[0] : rows
      if (!error && data && data.id === currentMatch.id) {
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
    setSearchStatus('searching')
  }

  const cancelSearch = async () => {
    if (!playerId) return
    await supabase.from('matchmaking_queue').delete().eq('player_id', playerId)
    setSearchStatus('idle')
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
    setOpponentUsername(null)
    setSearchStatus('idle')
    refetchMatchesCount()
  }

  const isMiniApp = !!tg
  const [isWideScreen, setIsWideScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
  )
  useEffect(() => {
    const onResize = () => setIsWideScreen(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // ПК (широкий экран) — веб-версия; узкий экран в Mini App — мобильная
  const useMobileLayout = isMiniApp && !isWideScreen

  return (
    <div className={`app ${useMobileLayout ? 'app--mobile' : 'app--desktop'}`}>
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
            className={activeView === 'matches' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveView('matches')}
          >
            {t.navMatches}
          </button>
          <button
            type="button"
            className={activeView === 'rating' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveView('rating')}
          >
            {t.navRating}
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
                    <h2 className="profile-display-name">{selectedPlayerRow.display_name ?? '—'}</h2>
                    {selectedPlayerRow.country_code && (
                      <p className="profile-country-badge">
                        {COUNTRIES.find((c) => c.code === selectedPlayerRow!.country_code)?.flag ?? '🌐'}{' '}
                        {COUNTRIES.find((c) => c.code === selectedPlayerRow!.country_code)?.name ?? selectedPlayerRow.country_code}
                      </p>
                    )}
                  </aside>
                  <div className="profile-main">
                    <div className="profile-rank-card">
                      <span className="profile-rank-badge">#{selectedPlayerRow.rank}</span>
                      <span className="profile-elo-big">{selectedPlayerRow.elo ?? '—'}</span>
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

            {user && playerId && (
              <div className="profile-edit-section">
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
            )}

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
                  {cameFromTelegram && (
                    <div className="profile-telegram-returned-hint">
                      <p className="panel-text">{t.profileTelegramReturnedNoParams}</p>
                      <p className="panel-hint">
                        <strong className="profile-telegram-domain">{typeof window !== 'undefined' ? window.location.host : ''}</strong>
        </p>
      </div>
                  )}
                  <p className="panel-text profile-browser-hint">{t.profileBrowserHint}</p>
                  <p className="panel-text profile-telegram-not">{t.profileTelegramNotConnected}</p>
                  {telegramLoginUrl ? (
                    <>
                      <a
                        href={telegramLoginUrl}
                        className="telegram-login-fallback primary-button"
                        rel="noopener noreferrer"
                      >
                        Log in with Telegram
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
                  <a
                    href={`https://t.me/${(import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string) || 'fcarea_bot'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-telegram-link-text"
                  >
                    {t.profileTelegramOrOpen} @{(import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string) || 'fcarea_bot'}
                  </a>
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

            {user && !playerId && (
              <p className="panel-text">
                {loadingProfile ? t.ladderProfileLoading : t.ladderProfileNotReady}
              </p>
            )}

            {user && playerId && searchStatus === 'idle' && (
              <>
                <button type="button" className="primary-button" onClick={startSearch}>
                  {t.ladderSearchButton}
                </button>
                <p className="panel-hint">{t.ladderHint}</p>
                <p className="panel-hint">{t.ladderTwoPlayersHint}</p>
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
                <p className="panel-text small">
                  {opponentUsername ? (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        const username = opponentUsername.replace(/^@/, '')
                        const url = `https://t.me/${username}`
                        const openLink = (tg as { openTelegramLink?: (u: string) => void })?.openTelegramLink
                        if (openLink) openLink(url)
                        else window.open(url, '_blank', 'noopener,noreferrer')
                      }}
                    >
                      {t.ladderMessageOpponent}
                    </button>
                  ) : (
                    <span className="panel-text-muted">{t.ladderMessageOpponent}</span>
                  )}
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
