import { useEffect, useMemo, useState } from 'react'
import './App.css'

type View = 'home' | 'profile' | 'ladder' | 'tournaments'

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

  const tg = window.Telegram?.WebApp

  useEffect(() => {
    if (!tg) return
    tg.ready()
    tg.expand()
  }, [tg])

  const user = tg?.initDataUnsafe?.user

  const displayName = useMemo(() => {
    if (!user) return 'Гость'
    if (user.username) return `@${user.username}`
    return [user.first_name, user.last_name].filter(Boolean).join(' ')
  }, [user])

  const currentViewTitle: Record<View, string> = {
    home: 'Главная',
    profile: 'Профиль',
    ladder: 'Быстрая игра',
    tournaments: 'Турниры',
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-main">
          <h1 className="app-title">FC Area</h1>
          <p className="app-subtitle">Ладдер, турниры и статистика</p>
        </div>
        <div className="app-user">
          <span className="app-user-name">{displayName}</span>
          <span className="app-user-rating">ELO: —</span>
        </div>
      </header>

      <main className="app-main">
        <h2 className="view-title">{currentViewTitle[activeView]}</h2>

        {activeView === 'home' && (
          <section className="grid">
            <button
              type="button"
              className="tile primary"
              onClick={() => setActiveView('ladder')}
            >
              <span className="tile-title">Быстрая игра</span>
              <span className="tile-text">
                Найди соперника за пару секунд и сыграй матч в течение 40 минут.
              </span>
            </button>

            <button
              type="button"
              className="tile"
              onClick={() => setActiveView('tournaments')}
            >
              <span className="tile-title">Турниры</span>
              <span className="tile-text">
                Участвуй в лигах, плей-офф и double round турнирах.
              </span>
            </button>

            <button
              type="button"
              className="tile"
              onClick={() => setActiveView('profile')}
            >
              <span className="tile-title">Профиль и статистика</span>
              <span className="tile-text">
                История матчей, ELO, винрейт и личная информация игрока.
              </span>
            </button>
          </section>
        )}

        {activeView === 'profile' && (
          <section className="panel">
            <h3 className="panel-title">Профиль игрока</h3>
            <div className="panel-row">
              <span className="label">Игрок</span>
              <span className="value">{displayName}</span>
            </div>
            <div className="panel-row">
              <span className="label">Общий рейтинг ELO</span>
              <span className="value">— (пока без расчёта)</span>
            </div>
            <div className="panel-row">
              <span className="label">Матчей сыграно</span>
              <span className="value">0</span>
            </div>
            <p className="panel-hint">
              Здесь позже появится полная статистика: история матчей, винрейт,
              графики формы и т.д. Данные будем брать из Supabase.
            </p>
          </section>
        )}

        {activeView === 'ladder' && (
          <section className="panel">
            <h3 className="panel-title">Быстрая игра (ладдер)</h3>
            <p className="panel-text">
              Здесь будет поиск соперника в реальном времени: выбор режима,
              очередь, дедлайн на матч (40 минут) и ввод результата.
            </p>
            <button type="button" className="primary-button" disabled>
              Поиск игры (скоро)
            </button>
            <p className="panel-hint">
              На этом шаге мы сначала сделаем локальный интерфейс и мок‑данные,
              а затем подключим реальный бэкенд и матчмейкинг.
            </p>
          </section>
        )}

        {activeView === 'tournaments' && (
          <section className="panel">
            <h3 className="panel-title">Турниры</h3>
            <p className="panel-text">
              Здесь появится список ближайших турниров, регистрация, сетка
              плей-офф и расписание раундов.
            </p>
            <ul className="list">
              <li className="list-item">
                <span className="list-title">Weekly Ladder Cup</span>
                <span className="list-sub">формат: single elimination</span>
              </li>
              <li className="list-item">
                <span className="list-title">Double Round League</span>
                <span className="list-sub">формат: double round robin</span>
              </li>
            </ul>
            <p className="panel-hint">
              Турнирные данные позже будем хранить в таблицах Supabase и
              управлять через админку.
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
          Главная
        </button>
        <button
          type="button"
          className={activeView === 'ladder' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('ladder')}
        >
          Игра
        </button>
        <button
          type="button"
          className={activeView === 'tournaments' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('tournaments')}
        >
          Турниры
        </button>
        <button
          type="button"
          className={activeView === 'profile' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('profile')}
        >
          Профиль
        </button>
      </nav>
    </div>
  )
}

export default App
