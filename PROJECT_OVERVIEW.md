## FC Area / Strike Ladder — обзор проекта

Этот файл нужен для новых агентов / разработчиков: после чтения должно быть понятно, **что это за проект, на чём он написан и как всё связано**.

### 1. Идея продукта

FC Area (Strike Ladder) — это веб‑платформа для **киберфутбольного ладдера**:

- игроки авторизуются через **Telegram** (Mini App / WebApp);
- попадают в **ladder‑очередь**, система матчмейкинга находит соперника;
- два игрока играют матч (офлайн, вне платформы), затем **подтверждают счёт**;
- по результату обновляются **ELO‑рейтинги, ранги, статистика, таблица топ‑игроков**;
- есть страницы: главная (home), профиль, ladder (поиск/лобби/чат), турниры, матчи, рейтинг.

Проект визуально стилизован под **киберспортивный UI с ярким оранжевым акцентом** (Strike‑стиль).

### 2. Технологии и структура

- **Frontend**: `React 19 + TypeScript + Vite`  
  - исходники: `frontend/src`  
  - корневой вход: `frontend/src/main.tsx`, основной компонент: `frontend/src/App.tsx`  
  - стили: один крупный файл `frontend/src/App.css` (в нём и базовые стили, и Strike‑тема).

- **Back‑end / БД**: `Supabase` (Postgres + Auth + Storage + Realtime)
  - `supabase-rpc-matches.sql` и другие `.sql` в корне — функции/представления/политики RLS для:
    - матчмейкинга (`matchmaking_queue`, `supabase-matchmaking.sql`),
    - матчей (`matches`, RPC `get_all_played_matches`, `get_my_pending_match`, `get_player_recent_matches`),
    - рейтинга и профилей (`players`, RPC `get_leaderboard`, `get_player_profile`),
    - аватаров (storage bucket `avatars`).
  - **Realtime** Supabase используется для:
    - получения найденного матча из очереди,
    - отслеживания изменения матча (когда соперник вводит/подтверждает счёт),
    - обновления текущего матча и чата в лобби.

- **Telegram‑бот** (Node.js):
  - директория `telegram-bot`;
  - стек: `node-telegram-bot-api`, `@supabase/supabase-js`, `dotenv`;
  - основная задача — обрабатывать `/start`, сохранять `telegram_id` и помогать авторизовать игрока, чтобы связать Telegram‑пользователя с записью в таблице `players` Supabase.

### 3. Основные сущности и данные

- **players** (Supabase `public.players`):
  - `id` (uuid) — основной идентификатор игрока;
  - `telegram_id`, `username`, `first_name`, `last_name`;
  - `display_name` (никнейм для интерфейса);
  - `elo` — текущий рейтинг;
  - `avatar_url`, `country_code`.

- **matches**:
  - `id`, `player_a_id`, `player_b_id`;
  - `score_a`, `score_b`, `result` (`PENDING`, `A_WIN`, `B_WIN`, `DRAW`);
  - `elo_delta_a`, `elo_delta_b` — изменение ELO;
  - `played_at` — время матча.

- **matchmaking_queue**:
  - очередь для `Quick play` / `Ladder`: по `player_id` определяется, кто сейчас ищет соперника.

- **RPC / функции Supabase** (важные):
  - `get_leaderboard(p_limit)` — топ‑игроки (ранг, ELO, матчи, W/D/L, GF/GA, win‑rate);
  - `get_player_profile(p_player_id)` — агрегированная статистика конкретного игрока;
  - `get_player_recent_matches(p_player_id)` — последние матчи игрока (для профиля и рейтинга);
  - `get_my_matches_count(p_player_id)` — количество подтверждённых матчей;
  - `get_all_played_matches()` — список всех сыгранных матчей (страница Matches);
  - `get_my_pending_match(p_player_id)` — поиск ещё неподтверждённого матча (лобби).

### 4. Главный React‑компонент (`App.tsx`)

В `App.tsx` сосредоточена вся фронтенд‑логика и роутинг по «экранам» (через внутренний `activeView`, а не через React Router):

- `View`:
  - `'home'`, `'profile'`, `'ladder'`, `'tournaments'`, `'matches'`, `'rating'`, `'admin'`;
  - верхнее меню (`nav`) переключает `activeView`, UI рендерится по `activeView === '...'`.

- **Состояния** (главное):
  - `activeView`, `lang` (EN/RO/RU);
  - `playerId`, `elo`, `matchesCount`;
  - `searchStatus` (`idle` | `searching` | `in_lobby`), `currentMatch`, `searchElapsed`;
  - `myProfileStats`, `myRecentMatches`, `myAvatarUrl`, `myCountryCode`, `myDisplayName`;
  - `leaderboard`, `selectedPlayerRow` — для рейтинга;
  - `allMatches` — для страницы Matches;
  - `chatMessages`, `chatInput` — чат внутри лобби;
  - `widgetUser` — данные Telegram‑пользователя из мини‑приложения, `displayName` строится по приоритету: **ник из профиля → имя/фамилия → @username → guest**.

- **Подписки/эффекты**:
  - загрузка/синк профиля при логине (upsert в `players`, получение `playerId`, начального `elo`, `matchesCount`);
  - загрузка `myProfileStats` и `myRecentMatches` при открытии `home`/`profile`;
  - **мгновенное обновление ELO в шапке после засчитанного матча**:
    - по Realtime‑обновлению `matches` (result ≠ `PENDING`) вызывается:
      - `refetchMatchesCount()`,
      - `get_player_profile(playerId)` → `setMyProfileStats`;
    - эффект по `myProfileStats` обновляет `elo` и `matchesCount` для шапки;
  - подписка на обновление матча в лобби (смена счёта, подтверждение результата);
  - загрузка/подписка на чат матча (только для текущего `currentMatch`);
  - загрузка полного рейтинга (`get_leaderboard`) при открытии `home` или `rating`;
  - загрузка последних матчей выбранного игрока в рейтинге (`get_player_recent_matches`).

### 5. Ключевые экраны

1. **Home (Strike‑главная)**
   - Шапка в стиле Strike: логотип, навигация, справа мини‑карточка пользователя с ELO и кнопкой `PLAY NOW`:
     - если статус поиска `idle` → переключает на `ladder` и вызывает `startSearch()`;
     - если `searching` → повторное нажатие отменяет поиск (`cancelSearch()`);
     - если `in_lobby` → переводит во view `ladder`.
   - Hero‑блок с большим слоганом, двумя кнопками `JOIN NOW` и `LEARN MORE`.
   - Полоса «Matches / Live countdown» (табы‑чипы).
   - Карточки: Quick Play, Tournaments, Your Profile, Ranking Ladder.
   - Справа блок `Your Stats` с ELO и сводной статистикой по последним матчам.
   - Внизу: **Top Players + Latest News** в одной строке, как на референсном макете.

2. **Profile**
   - Левая узкая карточка с аватаром/никнеймом/страной.
   - Справа табы: Overview / Edit Profile / Settings.
   - **Overview**:
     - крупный ELO + ранговый бейдж (`LEVEL N` / `LEVEL 10 - ELITE`);
     - грид статистики (Matches, Wins, Draws, Losses, GF/GA, Win rate);
     - таблица `Last 10 matches` с колонками Player / Score / Result / ELO / Date и пилюлями W/L/D.
   - **Edit profile** — изменение `display_name`, загрузка/URL аватара, выбор страны.
   - **Settings** — данные Telegram (username, id), кнопка `Logout` (сброс связки Telegram).

3. **Ladder (поиск, лобби, чат)**
   - Стартовый экран: кнопка `Search` запускает матчмейкинг (upsert в `matchmaking_queue`).  
   - Во время поиска показывается баннер с таймером; Realtime/опрос проверяют наличие `pending` матча.  
   - Лобби:
     - информация об оппоненте;
     - ввод счёта (A/B);
     - чат двух игроков;
     - подтверждение/отклонение результата.
   - После того как оба подтвердили счёт:
     - матч переводится из `PENDING` в финальный результат,
     - ELO/статистика обновляются в Supabase,
     - фронт **сразу** подтягивает новые значения в шапку и профиль.

4. **Rating (страница рейтинга по референсу Strike Ladder)**
   - **Слева** — таблица Top Players:
     - колонки: `#`, Nickname (аватар + ник), ELO, Matches, Win %;
     - строка выбранного игрока подсвечена (`rating-row--active`);
     - клик по строке обновляет правую панель.
   - **Справа** — панель игрока:
     - заголовок с ником и флагом страны;
     - большой ELO + бейдж `LEVEL N` / `LEVEL 10 - ELITE`;
     - грид карточек: Matches, Wins, Losses, GF/GA, Win rate;
     - блок `Last 5 matches` (на основе тех же стилей, что и профиль):
       - Opponent, Score, Result (W/L/D pill), ELO ± (стрелка вверх/вниз) и Date.

5. **Matches**
   - Таблица последних сыгранных матчей со счётом, результатом и изменением ELO (на всех игроков).

6. **Tournaments / Admin**
   - Заглушки/панели с текстом и списком, оформленные в Strike‑стиле (карточки, панели).

### 6. Языки и локализация

Интерфейс полностью локализован на **3 языка**: `en`, `ro`, `ru`:

- словарь хранится в `messages` в начале `App.tsx`;
- все подписи (кнопки, заголовки, таблицы, хелп‑тексты) должны браться из `t.*` (где `t = messages[lang]`);
- язык переключается кнопками `EN / RO / RU` в шапке, состояние — `lang` в `App`.

### 7. Правила отображения никнейма

Отдельно важно: **везде по сайту показываем не Telegram‑логин, а ник профиля, если он есть**.

Функция вычисления `displayName`:

- если пользователь не авторизован → `guestName` из словаря;
- если в профиле задан `myDisplayName` → его и показываем;
- иначе пытаемся собрать `first_name + last_name`;
- если и этого нет — используем `@username` из Telegram;
- если ничего нет — снова `guestName`.

Этим `displayName` пользуются:

- шапка (справа — имя игрока и аватар);
- мобильное меню (nav‑drawer);
- профиль (заголовок слева и на странице).

### 8. Разработка и запуск

- **Frontend**:
  - установить зависимости: `cd frontend && npm install`;
  - dev‑режим: `npm run dev` (Vite, порт по умолчанию 5173);
  - сборка: `npm run build`.

- **Telegram‑бот**:
  - `cd telegram-bot && npm install`;
  - `.env` (или `.env.example` как шаблон) должен содержать токен бота и URL Supabase;
  - запуск: `npm run dev` или `npm start`.

- Supabase:
  - применить SQL‑скрипты (`supabase-*.sql`) в панели Supabase или через CLI;
  - убедиться, что есть bucket `avatars` (public) и заданы необходимые RLS‑политики.

### 9. Что важно помнить новому агенту

- **Не ломать контракт** RPC‑функций Supabase (`get_player_profile`, `get_player_recent_matches`, `get_leaderboard` и т.д.) — фронт на них сильно завязан.
- Любые правки шапки должны учитывать:
  - состояние `elo`, `matchesCount`,
  - статусы поиска/лобби (`searchStatus`),
  - `displayName` по описанным выше правилам.
- UI уже приведён к единому Strike‑стилю; новые страницы лучше сразу верстать в `App.css` на основе существующих токенов (`--strike-*`). +
