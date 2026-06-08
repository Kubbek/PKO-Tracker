import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { chipSplit, r2 } from '../lib/bounty'
import { useToast } from '../lib/useToast'
import SeatGrid from '../components/SeatGrid'
import OvalTable from '../components/OvalTable'
import ThemeSwitcher from '../components/ThemeSwitcher'

// ── CHOP MODAL ────────────────────────────────────────────────────────────────
function ChopModal({ players, tournament, onClose, onDone, show }) {
  const activePlayers = players.filter(p => p.active)
  const [step, setStep] = useState(1)
  const [losers, setLosers] = useState([])
  const [winners, setWinners] = useState([])

  const totalLoserBounty = losers.reduce((s, id) => {
    const p = players.find(x => x.id === id); return s + (p?.bounty || 0)
  }, 0)
  const sharePerWinner = winners.length > 0 ? r2(totalLoserBounty / winners.length) : 0

  function toggle(id, list, setList) {
    setList(l => l.includes(id) ? l.filter(x => x !== id) : [...l, id])
  }

  async function confirm() {
    const place = activePlayers.length
    const ops = []
    losers.forEach((id, i) => {
      ops.push(supabase.from('players').update({ active: false, bounty: 0, elim_by: 'chop', place: place - i }).eq('id', id))
    })
    winners.forEach(id => {
      const p = players.find(x => x.id === id)
      ops.push(supabase.from('players').update({ bounty: r2(p.bounty + sharePerWinner), pocket_bounty: r2(p.pocket_bounty + sharePerWinner) }).eq('id', id))
    })
    await Promise.all(ops)
    onDone()
    onClose()
  }

  const pill = (label, active, color) => ({
    padding: '7px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
    border: `1px solid ${active ? color : 'var(--border)'}`,
    background: active ? `${color}18` : 'var(--bg2)', color: active ? color : 'var(--text2)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Chop</h2>
          <span style={{ fontSize: 12, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>Krok {step} / 2</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1rem' }}>
          {step === 1 ? 'Zaznacz graczy którzy zostają wyeliminowani.' : 'Zaznacz graczy eliminujących – bounty podzieli się między nich równo.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--red)', marginBottom: 6 }}>Wyeliminowani</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
              {step === 1 ? activePlayers.map(p => (
                <button key={p.id} style={pill(p.name, losers.includes(p.id), 'var(--red)')} onClick={() => toggle(p.id, losers, setLosers)}>
                  <span>{p.name}</span><span style={{ fontSize: 11, opacity: 0.7 }}>{r2(p.bounty)} zł</span>
                </button>
              )) : losers.map(id => {
                const p = players.find(x => x.id === id)
                return <div key={id} style={{ ...pill(p?.name, true, 'var(--red)'), cursor: 'default' }}><span>{p?.name}</span><span style={{ fontSize: 11 }}>{r2(p?.bounty)} zł</span></div>
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--green)', marginBottom: 6 }}>Eliminujący</div>
            {step === 1
              ? <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>Wybierz najpierw wyeliminowanych →</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
                  {activePlayers.filter(p => !losers.includes(p.id)).map(p => (
                    <button key={p.id} style={pill(p.name, winners.includes(p.id), 'var(--green)')} onClick={() => toggle(p.id, winners, setWinners)}>
                      <span>{p.name}</span>
                      <span style={{ fontSize: 11, opacity: 0.7 }}>{winners.includes(p.id) && sharePerWinner > 0 ? `+${sharePerWinner} zł` : `${r2(p.bounty)} zł`}</span>
                    </button>
                  ))}
                </div>
            }
          </div>
        </div>

        {step === 2 && winners.length > 0 && (
          <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', fontSize: 13 }}>
            <span style={{ color: 'var(--text2)' }}>Łączna pula: </span>
            <strong style={{ color: 'var(--accent)' }}>{r2(totalLoserBounty)} zł</strong>
            <span style={{ color: 'var(--text2)' }}> ÷ {winners.length} graczy = </span>
            <strong style={{ color: 'var(--green)' }}>{sharePerWinner} zł</strong>
            <span style={{ color: 'var(--text2)' }}> każdy</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Anuluj</button>
          {step === 1
            ? <button className="btn btn-accent" style={{ flex: 1 }} disabled={losers.length === 0} onClick={() => setStep(2)}>Dalej →</button>
            : <button className="btn btn-accent" style={{ flex: 1 }} disabled={winners.length === 0} onClick={confirm}>Zatwierdź chop</button>
          }
        </div>
      </div>
    </div>
  )
}

// ── PLAYER POPUP ──────────────────────────────────────────────────────────────
function PlayerPopup({ player, players, eliminations, tournament, onClose, onBountyChange }) {
  const [bountyInput, setBountyInput] = useState(String(r2(player.bounty)))
  const killed = eliminations.filter(e => e.winner_name === player.name)

  async function saveBounty() {
    const val = parseFloat(bountyInput)
    if (isNaN(val) || val < 0) return
    await supabase.from('players').update({ bounty: r2(val) }).eq('id', player.id)
    onBountyChange()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 320 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{player.name}</h2>
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: '1rem', fontSize: 13 }}>
          {[
            ['Stół / miejsce', `${player.table_num} / ${player.seat}`],
            ['Bounty na głowie', `${r2(player.bounty)} zł`],
            ['Zebrano łącznie', `${r2(player.pocket_bounty)} zł`],
            ['Eliminacje', killed.length],
          ].map(([l, v]) => (
            <div key={l} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{l}</div>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', marginBottom: 6 }}>Zmień bounty</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="number" value={bountyInput} min="0" onChange={e => setBountyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveBounty()}
              style={{ flex: 1, padding: '8px 12px', background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            <button className="btn btn-accent" onClick={saveBounty}>Zapisz</button>
          </div>
        </div>

        {killed.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', marginBottom: 6 }}>Wyeliminowani</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 140, overflowY: 'auto' }}>
              {killed.map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--bg2)', borderRadius: 6, fontSize: 12 }}>
                  <span style={{ color: 'var(--text)' }}>{e.loser_name}</span>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>+{r2(e.loser_bounty_before / 2)} zł</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── MOVE PLAYER MODAL ─────────────────────────────────────────────────────────
function MovePlayerModal({ player, activePlayers, onClose, onDone }) {
  const [newTable, setNewTable] = useState(String(player.table_num))
  const [newSeat, setNewSeat] = useState(String(player.seat))

  async function save() {
    const t = parseInt(newTable), s = parseInt(newSeat)
    if (isNaN(t) || isNaN(s) || s < 1 || s > 9) return
    const taken = activePlayers.find(p => p.table_num === t && p.seat === s && p.id !== player.id)
    if (taken) { alert('Miejsce zajęte przez ' + taken.name); return }
    await supabase.from('players').update({ table_num: t, seat: s }).eq('id', player.id)
    onDone(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 210, padding: '1rem' }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 300 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1rem', fontSize: 18 }}>Przenieś {player.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1rem' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Stół</label>
            <select value={newTable} onChange={e => setNewTable(e.target.value)}>
              {Array.from({ length: 10 }, (_, i) => <option key={i+1} value={i+1}>Stół {i+1}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Miejsce (1–9)</label>
            <input type="number" min="1" max="9" value={newSeat} onChange={e => setNewSeat(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Anuluj</button>
          <button className="btn btn-accent" style={{ flex: 1 }} onClick={save}>Przenieś</button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN TD VIEW ──────────────────────────────────────────────────────────────
export default function TDView({ tournament, onRefresh, onLogout }) {
  const { show, ToastContainer } = useToast()
  const [tab, setTab] = useState('tables')
  const [showSetup, setShowSetup] = useState(!tournament)
  const [setupForm, setSetupForm] = useState({ initBounty: 100, minChip: 25 })
  const [addForm, setAddForm] = useState({ name: '', tableNum: '1', seat: '', bounty: '' })
  const [selectedWinner, setSelectedWinner] = useState(null)
  const [selectedLoser, setSelectedLoser] = useState(null)
  const [viewTable, setViewTable] = useState(1)
  const [tableView, setTableView] = useState('oval')
  const [tableSize, setTableSize] = useState('m')
  const [showChop, setShowChop] = useState(false)
  const [popupPlayer, setPopupPlayer] = useState(null)
  const [movePlayer, setMovePlayer] = useState(null)
  const winnerRef = useRef(null)
  const elimLock = useRef(false)

  const players = tournament?.players || []
  const eliminations = tournament?.eliminations || []
  const activePlayers = players.filter(p => p.active)
  const tables = [...new Set(activePlayers.map(p => p.table_num))].sort((a, b) => a - b)
  const validTables = tables.length > 0 ? tables : [1]
  const currentTable = validTables.includes(viewTable) ? viewTable : validTables[0]

  const sizeMin = { s: 220, m: 300, l: 420 }

  async function createTournament() {
    const { error } = await supabase.from('tournaments').insert({ init_bounty: setupForm.initBounty, min_chip: setupForm.minChip, status: 'active' })
    if (error) { show('Błąd: ' + error.message); return }
    show('Turniej utworzony!'); setShowSetup(false); onRefresh()
  }

  async function addPlayer(e) {
    e.preventDefault()
    if (!addForm.name || !addForm.seat) { show('Wypełnij pola'); return }
    const seat = parseInt(addForm.seat), tableNum = parseInt(addForm.tableNum)
    if (isNaN(seat) || seat < 1 || seat > 9) { show('Miejsce 1–9'); return }
    const taken = activePlayers.find(p => p.table_num === tableNum && p.seat === seat)
    if (taken) { show('Miejsce zajęte przez ' + taken.name); return }
    const bounty = parseFloat(addForm.bounty) || tournament.init_bounty
    const existing = players.find(p => p.name === addForm.name && p.table_num === tableNum && p.seat === seat && !p.active)
    if (existing) {
      const nr = (existing.rebuys || 1) + 1
      await supabase.from('players').update({ active: true, bounty, place: null, elim_by: null, rebuys: nr }).eq('id', existing.id)
      show(`${addForm.name} rebuy #${nr}!`)
    } else {
      const same = players.filter(p => p.name === addForm.name)
      const rebuys = same.length > 0 ? Math.max(...same.map(p => p.rebuys || 1)) + 1 : 1
      await supabase.from('players').insert({ tournament_id: tournament.id, name: addForm.name, table_num: tableNum, seat, bounty, pocket_bounty: 0, active: true, rebuys })
      show(`${addForm.name} dodany!`)
    }
    setAddForm(f => ({ ...f, name: '', seat: '' })); onRefresh()
  }

  function handleSeatClick(player) {
    if (!winnerRef.current) {
      winnerRef.current = player.id; setSelectedWinner(player.id); setSelectedLoser(null)
    } else if (player.id === winnerRef.current) {
      winnerRef.current = null; setSelectedWinner(null); setSelectedLoser(null)
    } else if (!selectedLoser) {
      const wid = winnerRef.current, lid = player.id
      setSelectedLoser(lid)
      setTimeout(() => { confirmElim(wid, lid); winnerRef.current = null }, 280)
    } else {
      winnerRef.current = null; setSelectedWinner(null); setSelectedLoser(null)
    }
  }

  function handleSeatRightClick(player, e) {
    e.preventDefault()
    setPopupPlayer(player)
  }

  async function confirmElim(winnerId, loserId) {
    try {
    const wid = winnerId ?? selectedWinner, lid = loserId ?? selectedLoser
    if (!wid || !lid || wid === lid) { show('Wybierz dwóch graczy'); return }
    if (elimLock.current) return; elimLock.current = true
    const winner = players.find(p => p.id === wid), loser = players.find(p => p.id === lid)
    if (!winner || !loser) { elimLock.current = false; return }
    const split = chipSplit(loser.bounty, tournament.min_chip)
    await Promise.all([
      supabase.from('players').update({ bounty: r2(winner.bounty + split.onHead), pocket_bounty: r2(winner.pocket_bounty + split.pocket) }).eq('id', winner.id),
      supabase.from('players').update({ active: false, bounty: 0, elim_by: winner.name, place: activePlayers.length }).eq('id', loser.id),
      supabase.from('eliminations').insert({ tournament_id: tournament.id, winner_id: winner.id, loser_id: loser.id, winner_name: winner.name, loser_name: loser.name, pocket: split.pocket, on_head: split.onHead, loser_bounty_before: loser.bounty })
    ])
    show(`+${split.pocket} zł do kieszeni`)
    setSelectedWinner(null); setSelectedLoser(null); winnerRef.current = null; elimLock.current = false; onRefresh()
  } catch(err) {
    show('Błąd zapisu – spróbuj ponownie')
    setSelectedWinner(null); setSelectedLoser(null); winnerRef.current = null; elimLock.current = false
  }
  }

  async function undoLastElim() {
    if (!eliminations.length) { show('Brak eliminacji'); return }
    const last = [...eliminations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    const winner = players.find(p => p.id === last.winner_id), loser = players.find(p => p.id === last.loser_id)
    if (!winner || !loser) { show('Nie można cofnąć'); return }
    await Promise.all([
      supabase.from('players').update({ bounty: r2(winner.bounty - last.on_head), pocket_bounty: r2(winner.pocket_bounty - last.pocket) }).eq('id', winner.id),
      supabase.from('players').update({ active: true, bounty: last.loser_bounty_before, elim_by: null, place: null }).eq('id', loser.id),
      supabase.from('eliminations').delete().eq('id', last.id)
    ])
    show(`Cofnięto: ${loser.name} wraca`); onRefresh()
  }

  // Drag-and-drop seat reassignment
  const dragRef = useRef(null)

  function handleDragStart(player) { dragRef.current = player }

  async function handleDrop(tableNum, seat) {
    if (!dragRef.current) return
    const p = dragRef.current
    const taken = activePlayers.find(x => x.table_num === tableNum && x.seat === seat && x.id !== p.id)
    if (taken) { show('Miejsce zajęte przez ' + taken.name); dragRef.current = null; return }
    await supabase.from('players').update({ table_num: tableNum, seat }).eq('id', p.id)
    dragRef.current = null; onRefresh()
  }

  if (!tournament || showSetup) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--body-bg)' }}>
      <ToastContainer />
      <div style={{ position: 'absolute', top: 16, right: 16 }}><ThemeSwitcher /></div>
      <div className="modal">
        <h2>Nowy turniej</h2>
        <div className="field"><label>Startowe bounty (zł)</label><input type="number" value={setupForm.initBounty} min="1" onChange={e => setSetupForm(f => ({ ...f, initBounty: +e.target.value }))} /></div>
        <div className="field"><label>Najmniejszy nominał (zł)</label><input type="number" value={setupForm.minChip} min="1" onChange={e => setSetupForm(f => ({ ...f, minChip: +e.target.value }))} /></div>
        <button className="btn btn-accent btn-full" onClick={createTournament}>Utwórz turniej</button>
        {tournament && <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setShowSetup(false)}>Anuluj</button>}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem 1.25rem' }}>
      <ToastContainer />

      {showChop && (
        <ChopModal players={players} tournament={tournament} onClose={() => setShowChop(false)} onDone={() => { show('Chop zakończony!'); onRefresh() }} />
      )}
      {popupPlayer && (
        <PlayerPopup player={popupPlayer} players={players} eliminations={eliminations} tournament={tournament}
          onClose={() => setPopupPlayer(null)} onBountyChange={() => { show('Bounty zaktualizowane'); onRefresh() }} />
      )}
      {movePlayer && (
        <MovePlayerModal player={movePlayer} activePlayers={activePlayers}
          onClose={() => setMovePlayer(null)} onDone={() => { show('Gracz przeniesiony'); onRefresh() }} />
      )}

      {/* HEADER */}
      <div className="app-header">
        <div>
          <span className="app-logo">PKO</span>
          <span className="app-logo-sub">TRACKER · TD</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <ThemeSwitcher />
          <div style={{ width: 1, height: 20, background: 'var(--border2)' }} />
          <div className="live-badge"><div className="live-dot" />{activePlayers.length} aktywnych</div>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={undoLastElim}>↩ Cofnij</button>
          <button className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--accent)' }} onClick={() => setShowChop(true)}>Chop</button>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowSetup(true)}>Nowy</button>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={onLogout}>Wyloguj</button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: '1.5rem' }}>
        <div className="stat-card"><div className="sl">Aktywni gracze</div><div className="sv accent num">{activePlayers.length}</div></div>
        <div className="stat-card green"><div className="sl">Pula bounty</div><div className="sv num" style={{ fontSize: 22 }}>{r2(activePlayers.reduce((s, p) => s + p.bounty, 0))} <span style={{ fontSize: 14, color: 'var(--text2)' }}>zł</span></div></div>
        <div className="stat-card"><div className="sl">Wypłacono</div><div className="sv num" style={{ fontSize: 22 }}>{r2(players.reduce((s, p) => s + p.pocket_bounty, 0))} <span style={{ fontSize: 14, color: 'var(--text2)' }}>zł</span></div></div>
        <div className="stat-card"><div className="sl">Eliminacje</div><div className="sv num">{eliminations.length}</div></div>
      </div>

      {/* TABS */}
      <div className="tab-bar" style={{ marginBottom: '1.5rem' }}>
        {[['tables','Stoły'],['players','Gracze'],['log','Historia'],['add','Dodaj gracza']].map(([id, label]) => (
          <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── TABLES TAB ── */}
      {tab === 'tables' && (
        <div>
          {/* Table selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {validTables.map(t => (
              <button key={t} className={`table-btn${currentTable===t?' active':''}`} onClick={() => setViewTable(t)}>
                Stół {t} <span style={{ fontSize: 11, opacity: 0.7 }}>· {activePlayers.filter(p => p.table_num===t).length}/9</span>
              </button>
            ))}
            {/* Size buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {['s','m','l'].map(sz => (
                <button key={sz} onClick={() => setTableSize(sz)}
                  style={{ padding: '5px 10px', fontSize: 11, fontWeight: 700, border: `1px solid ${tableSize===sz?'var(--accent)':'var(--border)'}`, background: tableSize===sz?'var(--accent-bg)':'transparent', color: tableSize===sz?'var(--accent)':'var(--text2)', borderRadius: 6, cursor: 'pointer', textTransform: 'uppercase' }}>
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Section title + view toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Stół {currentTable}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: !selectedWinner?'var(--text2)':!selectedLoser?'var(--green)':'var(--accent)' }}>
                {!selectedWinner?'Klik eliminującego':!selectedLoser?'→ Klik wyeliminowanego':'Przetwarzanie...'}
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {[['oval','⬭'],['grid','⊞']].map(([v,icon]) => (
                  <button key={v} onClick={() => setTableView(v)}
                    style={{ padding: '3px 9px', fontSize: 13, border: `1px solid ${tableView===v?'var(--accent)':'var(--border)'}`, background: tableView===v?'var(--accent-bg)':'transparent', color: tableView===v?'var(--accent)':'var(--text2)', borderRadius: 6, cursor: 'pointer' }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table display */}
          <div style={{ maxWidth: sizeMin[tableSize] * 3 + 40 }}>
            {tableView === 'oval'
              ? <OvalTable players={activePlayers} tableNum={currentTable} onSeatClick={handleSeatClick}
                  onSeatRightClick={handleSeatRightClick} onDragStart={handleDragStart} onDrop={handleDrop}
                  selectedWinner={selectedWinner} selectedLoser={selectedLoser} />
              : <SeatGrid players={activePlayers} tableNum={currentTable} onSeatClick={handleSeatClick}
                  onSeatRightClick={handleSeatRightClick} onDragStart={handleDragStart} onDrop={handleDrop}
                  selectedWinner={selectedWinner} selectedLoser={selectedLoser} />
            }
          </div>

          {selectedWinner && !selectedLoser && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn btn-danger btn-full" onClick={() => confirmElim()}>Zatwierdź eliminację</button>
              <button className="btn btn-ghost" onClick={() => { winnerRef.current=null; setSelectedWinner(null); setSelectedLoser(null) }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* ── PLAYERS TAB ── */}
      {tab === 'players' && (
        <div>
          <div className="section-title">Ranking bounty <span style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>– prawy klik = szczegóły / edycja</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...activePlayers].sort((a, b) => b.bounty - a.bounty).map((p, i) => (
              <div key={p.id} className={`player-row fade-up${i===0?' top':''}`} style={{ animationDelay: `${i*0.03}s`, cursor: 'context-menu' }}
                onContextMenu={e => { e.preventDefault(); setPopupPlayer(p) }}>
                <div className="num" style={{ fontSize: 20, color: i===0?'var(--accent)':'var(--text3)', textAlign: 'center', fontWeight: 700 }}>{i===0?'♛':i+1}</div>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                  {p.rebuys > 1 && <span className="badge badge-accent" style={{ marginLeft: 6 }}>R{p.rebuys}</span>}
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Stół {p.table_num} · Miejsce {p.seat}
                    <button style={{ fontSize: 10, color: 'var(--text3)', background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', cursor: 'pointer' }}
                      onClick={() => setMovePlayer(p)}>Przenieś</button>
                  </div>
                </div>
                <div className="num" style={{ fontSize: 20, color: 'var(--accent)', textAlign: 'right' }}>{r2(p.bounty)} <span style={{ fontSize: 13, color: 'var(--text2)' }}>zł</span></div>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>+{r2(p.pocket_bounty)} zł</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LOG TAB ── */}
      {tab === 'log' && (
        <div>
          <div className="section-title">Historia eliminacji</div>
          {eliminations.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Brak eliminacji</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...eliminations].reverse().map((e, i) => (
              <div key={e.id} className="log-entry fade-up" style={{ animationDelay: `${i*0.02}s` }}>
                <span className="log-amount">+{e.pocket} zł</span>
                <strong>{e.winner_name}</strong>
                <span style={{ color: 'var(--text3)' }}> eliminuje </span>
                <strong style={{ color: 'var(--red)' }}>{e.loser_name}</strong>
                <span style={{ color: 'var(--text3)' }}> · +{e.on_head} zł na głowę</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADD TAB ── */}
      {tab === 'add' && (
        <div style={{ maxWidth: 480 }}>
          <div className="section-title">Dodaj gracza</div>
          <form onSubmit={addPlayer}>
            <div className="field"><label>Imię / nick</label><input value={addForm.name} placeholder="Imię gracza" onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field"><label>Stół</label>
                <select value={addForm.tableNum} onChange={e => setAddForm(f => ({ ...f, tableNum: e.target.value }))}>
                  {Array.from({ length: 10 }, (_, i) => <option key={i+1} value={i+1}>Stół {i+1}</option>)}
                </select>
              </div>
              <div className="field"><label>Miejsce (1–9)</label><input type="number" min="1" max="9" value={addForm.seat} placeholder="1–9" onChange={e => setAddForm(f => ({ ...f, seat: e.target.value }))} /></div>
            </div>
            <div className="field"><label>Bounty (zł) – domyślnie {tournament.init_bounty} zł</label><input type="number" value={addForm.bounty} placeholder={tournament.init_bounty} onChange={e => setAddForm(f => ({ ...f, bounty: e.target.value }))} /></div>
            <button type="submit" className="btn btn-accent btn-full">Dodaj gracza</button>
          </form>
        </div>
      )}
    </div>
  )
}
