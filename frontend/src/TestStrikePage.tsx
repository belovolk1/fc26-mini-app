/**
 * Тестовая страница-референс: в точности как на фото Strike Ladder.
 * Открыть: http://localhost:5173/?test=strike
 */
import './test-strike.css'

export function TestStrikePage() {
  return (
    <div className="test-strike">
      {/* Header */}
      <header className="ts-header">
        <div className="ts-header-logo">
          <img src="/Logo.svg" alt="" className="ts-logo-icon" aria-hidden />
          <span className="ts-logo-text">STRIKE LADDER</span>
        </div>
        <nav className="ts-nav">
          <a href="#tournaments" className="ts-nav-link">TOURNAMENTS</a>
          <a href="#ladders" className="ts-nav-link">LADDERS</a>
          <a href="#stats" className="ts-nav-link">STATS</a>
          <a href="#shop" className="ts-nav-link">SHOP</a>
        </nav>
        <div className="ts-header-right">
          <div className="ts-user">
            <div className="ts-avatar" />
            <div className="ts-user-info">
              <span className="ts-user-name">PLAYER_ONE</span>
              <span className="ts-user-lvl">LVL 55</span>
              <div className="ts-progress-bar">
                <div className="ts-progress-fill" style={{ width: '65%' }} />
              </div>
            </div>
          </div>
          <button type="button" className="ts-btn ts-btn-outline">CREATE TEAM</button>
        </div>
      </header>

      <main className="ts-main">
        {/* Hero */}
        <section className="ts-hero">
          <div className="ts-hero-content">
            <h1 className="ts-hero-title">
              COMPETE.<br />CLIMB.<br />DOMINATE.
            </h1>
            <p className="ts-hero-desc">
              Join the ultimate soccer esports ladder. Prove your skills, earn rank, and win prizes.
            </p>
            <div className="ts-hero-btns">
              <button type="button" className="ts-btn ts-btn-primary">JOIN NOW</button>
              <button type="button" className="ts-btn ts-btn-outline-white">LEARN MORE</button>
            </div>
          </div>
          <div className="ts-hero-graphic" aria-hidden="true">
            <div className="ts-field-outline" />
          </div>
        </section>

        {/* Ticker */}
        <section className="ts-ticker">
          <button type="button" className="ts-ticker-arrow" aria-label="Prev">›</button>
          <div className="ts-ticker-content">
            <span className="ts-ticker-item">MATCHES</span>
            <span className="ts-ticker-vs">VS</span>
            <span className="ts-ticker-item">ESPORTS TEAM</span>
            <span className="ts-ticker-item">TOURNAMENTS</span>
            <span className="ts-ticker-vs">VS</span>
            <span className="ts-ticker-item">PLAYERMI</span>
          </div>
          <span className="ts-ticker-countdown">LIVE COUNTDOWN: 8H</span>
          <span className="ts-ticker-arrow-right">›</span>
        </section>

        {/* Cards + Your Stats */}
        <section className="ts-mid">
          <div className="ts-cards">
            <div className="ts-card">
              <div className="ts-card-icon">🎮</div>
              <h3 className="ts-card-title">QUICK PLAY</h3>
              <p className="ts-card-desc">Jump into a ranked match instantly. Solo or Duo.</p>
              <button type="button" className="ts-btn ts-btn-primary ts-btn-sm">PLAY NOW</button>
            </div>
            <div className="ts-card">
              <div className="ts-card-icon">🏆</div>
              <h3 className="ts-card-title">TOURNAMENTS</h3>
              <p className="ts-card-desc">Weekly and monthly cups. Big prizes.</p>
              <button type="button" className="ts-btn ts-btn-outline ts-btn-sm">VIEW EVENTS</button>
            </div>
            <div className="ts-card">
              <div className="ts-card-icon">👤</div>
              <h3 className="ts-card-title">YOUR PROFILE</h3>
              <p className="ts-card-desc">Track your ELO, stats, and achievements.</p>
              <button type="button" className="ts-btn ts-btn-outline ts-btn-sm">VIEW STATS</button>
            </div>
            <div className="ts-card">
              <div className="ts-card-icon">📊</div>
              <h3 className="ts-card-title">RANKING LADDER</h3>
              <p className="ts-card-desc">See where you stand among the best.</p>
              <button type="button" className="ts-btn ts-btn-outline ts-btn-sm">VIEW LADDER</button>
            </div>
          </div>
          <aside className="ts-stats">
            <h3 className="ts-stats-title">YOUR STATS</h3>
            <div className="ts-elo-block">
              <span className="ts-elo-label">ELO</span>
              <span className="ts-elo-value">1850</span>
              <div className="ts-elo-bar">
                <div className="ts-elo-bar-fill" style={{ width: '62%' }} />
              </div>
            </div>
            <div className="ts-stats-row">
              <div className="ts-stat">
                <span className="ts-stat-label">MATCHES</span>
                <span className="ts-stat-value">230</span>
              </div>
              <div className="ts-stat">
                <span className="ts-stat-label">WIN RATE</span>
                <span className="ts-stat-value">62%</span>
              </div>
              <div className="ts-stat">
                <span className="ts-stat-label">K/D</span>
                <span className="ts-stat-value">1.45</span>
              </div>
            </div>
            <h4 className="ts-recent-title">Recent Matches</h4>
            <ul className="ts-recent-list">
              <li className="ts-recent-item ts-recent-win"><span className="ts-recent-icon">✓</span><span>PLAYER_ONE</span><span className="ts-recent-meta">Opponent</span><span>FINAL 3-0</span></li>
              <li className="ts-recent-item ts-recent-loss"><span className="ts-recent-icon">✗</span><span>ALERET</span><span className="ts-recent-meta">Beam</span><span>FINAL 2-3</span></li>
              <li className="ts-recent-item ts-recent-win"><span className="ts-recent-icon">✓</span><span>GOAL_MACHINE</span><span className="ts-recent-meta">Gordian</span><span>FINAL 1-0</span></li>
            </ul>
          </aside>
        </section>

        {/* Top Players + Latest News */}
        <section className="ts-bottom">
          <div className="ts-top-players">
            <h3 className="ts-section-title">TOP PLAYERS</h3>
            <ul className="ts-player-list">
              <li className="ts-player ts-player-first">
                <span className="ts-player-rank">1</span>
                <span className="ts-player-crown">👑</span>
                <div className="ts-player-avatar" />
                <span className="ts-player-name">GOAL_MACHINE</span>
                <span className="ts-player-team">Team Name</span>
                <span className="ts-player-elo">ELO 2450</span>
              </li>
              <li className="ts-player">
                <span className="ts-player-rank">2</span>
                <div className="ts-player-avatar" />
                <span className="ts-player-name">GOAL_MACHINE</span>
                <span className="ts-player-team">Team Name</span>
                <span className="ts-player-elo">ELO 2450</span>
              </li>
              <li className="ts-player">
                <span className="ts-player-rank">3</span>
                <div className="ts-player-avatar" />
                <span className="ts-player-name">BEVALZER</span>
                <span className="ts-player-team">Team Name</span>
                <span className="ts-player-elo">ELO 2020</span>
              </li>
              <li className="ts-player">
                <span className="ts-player-rank">4</span>
                <div className="ts-player-avatar" />
                <span className="ts-player-name">ALINESON</span>
                <span className="ts-player-team">Team Name</span>
                <span className="ts-player-elo">ELO 1950</span>
              </li>
              <li className="ts-player">
                <span className="ts-player-rank">5</span>
                <div className="ts-player-avatar" />
                <span className="ts-player-name">BOSRBY</span>
                <span className="ts-player-team">Team Name</span>
                <span className="ts-player-elo">ELO 1850</span>
              </li>
            </ul>
          </div>
          <div className="ts-news">
            <h3 className="ts-section-title">LATEST NEWS</h3>
            <div className="ts-news-grid">
              <article className="ts-news-card">
                <div className="ts-news-thumb" />
                <h4 className="ts-news-title">NEW SEASON UPDATE: MAP CHANGES & BALANCE</h4>
                <p className="ts-news-desc">Short description placeholder.</p>
                <span className="ts-news-date">7 days ago</span>
              </article>
              <article className="ts-news-card">
                <div className="ts-news-thumb" />
                <h4 className="ts-news-title">ESPORTS FINALS: WATCH LIVE!</h4>
                <p className="ts-news-desc">Short description placeholder.</p>
                <span className="ts-news-date">7 days ago</span>
              </article>
              <article className="ts-news-card">
                <div className="ts-news-thumb" />
                <h4 className="ts-news-title">COMMUNITY SPOTLIGHT: TOP 10 GOALS</h4>
                <p className="ts-news-desc">Short description placeholder.</p>
                <span className="ts-news-date">7 days ago</span>
              </article>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="ts-footer">
          <div className="ts-footer-links">
            <a href="?">← Back to app</a>
            <a href="#about">About Us</a>
            <a href="#terms">Terms of Service</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="ts-footer-social">
            <span aria-label="Twitter">𝕏</span>
            <span aria-label="Facebook">f</span>
            <span aria-label="Instagram">📷</span>
            <span aria-label="YouTube">▶</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
