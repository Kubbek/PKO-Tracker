import { useState } from 'react'
import { r2 } from '../lib/bounty'
import ThemeSwitcher from '../components/ThemeSwitcher'
import OvalTable from '../components/OvalTable'

export default function SpectatorView({ tournament, onLogout }) {
  const [tab, setTab] = useState('ranking')
  const [viewTable, setViewTable] = useState(null)

  const players = tournament?.players || []
  const eliminations = tournament?.eliminations || []
  const activePlayers = players.filter(p => p.active)
  const sorted = [...activePlayers].sort((a, b) => b.bounty - a.bounty)
  const tables = [...new Set(activePlayers.map(p => p.table_num))].sort((a, b) => a - b)
  const currentTable = viewTable || tables[0] || 1

  if (!tournament) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div className="app-logo" style={{ fontSize: 48 }}>PKO</div>
      <div style={{ color: 'var(--text2)', fontSize: 13 }}>Turniej nie został jeszcze uruchomiony...</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '1rem 1.25rem' }}>

      <div className="app-header">
        <div>
          <span className="app-logo">PKO TRACKER</span>
          <div style={{ marginTop: 4 }}>
            <div className="live-badge" style={{ display: 'inline-flex' }}>
              <div className="live-dot" />LIVE
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeSwitcher />
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={onLogout}>← Wróć</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '1.5rem' }}>
        <div className="stat-card"><div className="sl">Graczy</div><div className="sv accent num">{activePlayers.length}</div></div>
        <div className="stat-card"><div className="sl">Eliminacje</div><div className="sv num">{eliminations.length}</div></div>
        <div className="stat-card green"><div className="sl">Top bounty</div><div className="sv green num" style={{ fontSize: 22 }}>{r2(sorted[0]?.bounty || 0)} <span style={{ fontSize: 13, color: 'var(--text2)' }}>zł</span></div></div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: '1.5rem' }}>
        {[['ranking','Ranking'],['tables','Stoły'],['feed','Eliminacje']].map(([id, label]) => (
          <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── RANKING ── */}
      {tab === 'ranking' && (
        <>
          <div className="section-title">Ranking bounty</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sorted.map((p, i) => (
              <div key={p.id} className={`player-row fade-up${i===0?' top':''}`} style={{ animationDelay: `${i*0.025}s`, gridTemplateColumns: '36px 1fr auto' }}>
                <div className="num" style={{ fontSize: 20, color: i===0?'var(--accent)':i<3?'var(--text2)':'var(--text3)', textAlign: 'center' }}>
                  {i===0?'♛':i+1}
                </div>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: i===0?'var(--accent2)':'var(--text)' }}>{p.name}</span>
                  {p.rebuys > 1 && <span className="badge badge-accent" style={{ marginLeft: 6 }}>R{p.rebuys}</span>}
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                    Stół {p.table_num} · Miejsce {p.seat}
                    {eliminations.filter(e => e.winner_name === p.name).length > 0 && (
                      <span className="badge badge-green" style={{ marginLeft: 6 }}>
                        {eliminations.filter(e => e.winner_name === p.name).length} elim.
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num" style={{ fontSize: 20, color: 'var(--accent)' }}>{r2(p.bounty)} <span style={{ fontSize: 12, color: 'var(--text2)' }}>zł</span></div>
                  <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>+{r2(p.pocket_bounty)} zł</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── TABLES ── */}
      {tab === 'tables' && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
            {tables.map(t => (
              <button key={t} className={`table-btn${currentTable===t?' active':''}`} onClick={() => setViewTable(t)}>
                Stół {t} <span style={{ fontSize: 11, opacity: 0.7 }}>· {activePlayers.filter(p => p.table_num===t).length}/9</span>
              </button>
            ))}
          </div>
          <div className="section-title">Stół {currentTable}</div>
          <OvalTable players={activePlayers} tableNum={currentTable} readOnly />
        </>
      )}

      {/* ── FEED ── */}
      {tab === 'feed' && (
        <>
          <div className="section-title">Ostatnie eliminacje</div>
          {eliminations.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Brak eliminacji</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[...eliminations].reverse().slice(0, 30).map((e, i) => (
              <div key={e.id} className="log-entry fade-up" style={{ animationDelay: `${i*0.02}s`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--green)' }}>{e.winner_name}</strong>
                  <span style={{ color: 'var(--text3)', margin: '0 5px' }}>eliminuje</span>
                  <strong style={{ color: 'var(--red)' }}>{e.loser_name}</strong>
                  <span style={{ color: 'var(--text3)', fontSize: 12 }}> · +{e.on_head} zł na głowę</span>
                </div>
                <span className="log-amount">+{e.pocket} zł</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
