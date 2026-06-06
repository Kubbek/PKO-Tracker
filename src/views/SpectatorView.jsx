import { r2 } from '../lib/bounty'

export default function SpectatorView({ tournament, onLogout }) {
  const players = tournament?.players || []
  const eliminations = tournament?.eliminations || []
  const activePlayers = players.filter(p => p.active)

  if (!tournament) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: 'var(--gold-light)' }}>♠ PKO Tracker</div>
      <div style={{ color: 'var(--text2)', fontSize: 14 }}>Turniej nie został jeszcze uruchomiony...</div>
    </div>
  )

  const sorted = [...activePlayers].sort((a, b) => b.bounty - a.bounty)
  const topBounty = sorted[0]?.bounty || 0

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: 'var(--gold-light)' }}>
          ♠ PKO Tracker
          <span style={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--success)', marginLeft: 10, background: 'var(--success-bg)', padding: '2px 10px', borderRadius: 20 }}>
            LIVE
          </span>
        </div>
        <button className="btn" style={{ fontSize: 12, padding: '5px 10px' }} onClick={onLogout}>← Wróć</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1.5rem' }}>
        {[
          ['Graczy', activePlayers.length],
          ['Eliminacje', eliminations.length],
          ['Największe bounty', r2(topBounty) + ' zł'],
        ].map(([label, val]) => (
          <div key={label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold-light)' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Bounty ranking */}
      <div className="section-title">Ranking bounty</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: '1.5rem' }}>
        {sorted.map((p, i) => (
          <div key={p.id} style={{
            display: 'grid', gridTemplateColumns: '28px 1fr auto',
            gap: 10, padding: '10px 14px',
            background: i === 0 ? 'rgba(201,168,76,0.08)' : 'var(--bg3)',
            border: `1px solid ${i === 0 ? 'var(--gold-dark)' : 'var(--border)'}`,
            borderRadius: 6, alignItems: 'center'
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? 'var(--gold)' : 'var(--text3)', textAlign: 'center' }}>
              {i === 0 ? '♛' : i + 1}
            </div>
            <div>
              <span style={{ fontWeight: 600, color: i === 0 ? 'var(--gold-light)' : 'var(--text)' }}>{p.name}</span>
              {p.rebuys > 1 && <span className="badge badge-warning" style={{ marginLeft: 6 }}>R{p.rebuys}</span>}
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                Stół {p.table_num} · Miejsce {p.seat}
                {p.elim_by === null && eliminations.filter(e => e.winner_name === p.name).length > 0 &&
                  <span style={{ color: 'var(--success)', marginLeft: 6 }}>
                    {eliminations.filter(e => e.winner_name === p.name).length} eliminacji
                  </span>
                }
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>{r2(p.bounty)} zł</div>
              <div style={{ fontSize: 11, color: 'var(--success)' }}>+{r2(p.pocket_bounty)} zł zebrane</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent eliminations */}
      <div className="section-title">Ostatnie eliminacje</div>
      {eliminations.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Brak eliminacji</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[...eliminations].reverse().slice(0, 15).map(e => (
          <div key={e.id} style={{
            padding: '8px 14px', background: 'var(--bg3)',
            borderRadius: 6, borderLeft: '2px solid var(--gold-dark)',
            fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <strong style={{ color: 'var(--success)' }}>{e.winner_name}</strong>
              <span style={{ color: 'var(--text3)' }}> eliminuje </span>
              <strong style={{ color: 'var(--danger)' }}>{e.loser_name}</strong>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>+{e.pocket} zł</div>
          </div>
        ))}
      </div>
    </div>
  )
}
