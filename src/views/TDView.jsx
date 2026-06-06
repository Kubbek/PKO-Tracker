import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { chipSplit, r2 } from '../lib/bounty'
import { useToast } from '../lib/useToast'
import SeatGrid from '../components/SeatGrid'

export default function TDView({ tournament, onRefresh, onLogout }) {
  const { show, ToastContainer } = useToast()
  const [tab, setTab] = useState('tables')
  const [showSetup, setShowSetup] = useState(!tournament)
  const [setupForm, setSetupForm] = useState({ initBounty: 100, minChip: 25 })
  const [addForm, setAddForm] = useState({ name: '', tableNum: '1', seat: '', bounty: '' })
  const [selectedWinner, setSelectedWinner] = useState(null)
  const [selectedLoser, setSelectedLoser] = useState(null)
  const [viewTable, setViewTable] = useState(1)
  const elimLock = useRef(false) // prevent double-fire

  const players = tournament?.players || []
  const eliminations = tournament?.eliminations || []
  const activePlayers = players.filter(p => p.active)
  const tables = [...new Set(activePlayers.map(p => p.table_num))].sort((a, b) => a - b)
  // Ensure current viewTable is always valid
  const validTables = tables.length > 0 ? tables : [1]

  // --- SETUP ---
  async function createTournament() {
    const { error } = await supabase.from('tournaments').insert({
      init_bounty: setupForm.initBounty,
      min_chip: setupForm.minChip,
      status: 'active'
    })
    if (error) { show('Błąd: ' + error.message); return }
    show('Turniej utworzony!')
    setShowSetup(false)
    onRefresh()
  }

  // --- ADD PLAYER ---
  async function addPlayer(e) {
    e.preventDefault()
    if (!addForm.name || !addForm.seat) { show('Wypełnij wszystkie pola'); return }
    const seat = parseInt(addForm.seat)
    if (isNaN(seat) || seat < 1 || seat > 9) { show('Miejsce musi być 1–9'); return }
    const tableNum = parseInt(addForm.tableNum)

    const taken = activePlayers.find(p => p.table_num === tableNum && p.seat === seat)
    if (taken) { show('Miejsce zajęte przez ' + taken.name); return }

    const bounty = parseFloat(addForm.bounty) || tournament.init_bounty

    // Rebuy: same name + table + seat, previously eliminated
    const existing = players.find(p =>
      p.name === addForm.name && p.table_num === tableNum && p.seat === seat && !p.active
    )

    if (existing) {
      const newRebuys = (existing.rebuys || 1) + 1
      await supabase.from('players').update({
        active: true, bounty, place: null, elim_by: null, rebuys: newRebuys
      }).eq('id', existing.id)
      show(`${addForm.name} rebuy #${newRebuys}!`)
    } else {
      // Count all entries with same name for rebuy numbering
      const sameNameEntries = players.filter(p => p.name === addForm.name)
      const rebuys = sameNameEntries.length > 0
        ? Math.max(...sameNameEntries.map(p => p.rebuys || 1)) + 1
        : 1
      await supabase.from('players').insert({
        tournament_id: tournament.id,
        name: addForm.name,
        table_num: tableNum,
        seat,
        bounty,
        pocket_bounty: 0,
        active: true,
        rebuys
      })
      show(`${addForm.name} dodany!`)
    }
    setAddForm(f => ({ ...f, name: '', seat: '' }))
    onRefresh()
  }

  // --- ELIMINATION ---
  // Use refs to avoid stale closure in setTimeout
  const winnerRef = useRef(null)

  function handleSeatClick(player) {
    if (!winnerRef.current) {
      // First click: set winner
      winnerRef.current = player.id
      setSelectedWinner(player.id)
      setSelectedLoser(null)
    } else if (player.id === winnerRef.current) {
      // Click same player: deselect
      winnerRef.current = null
      setSelectedWinner(null)
      setSelectedLoser(null)
    } else if (!selectedLoser) {
      // Second click: set loser and auto-confirm
      const wid = winnerRef.current
      const lid = player.id
      setSelectedLoser(lid)
      setTimeout(() => {
        confirmElim(wid, lid)
        winnerRef.current = null
      }, 280)
    } else {
      // Third click: reset
      winnerRef.current = null
      setSelectedWinner(null)
      setSelectedLoser(null)
    }
  }

  async function confirmElim(winnerId, loserId) {
    const wid = winnerId ?? selectedWinner
    const lid = loserId ?? selectedLoser
    if (!wid || !lid || wid === lid) { show('Wybierz dwóch różnych graczy'); return }
    if (elimLock.current) return
    elimLock.current = true

    const winner = players.find(p => p.id === wid)
    const loser = players.find(p => p.id === lid)
    if (!winner || !loser) { elimLock.current = false; return }

    const split = chipSplit(loser.bounty, tournament.min_chip)

    const [r1, r2e, r3] = await Promise.all([
      supabase.from('players').update({
        bounty: r2(winner.bounty + split.onHead),
        pocket_bounty: r2(winner.pocket_bounty + split.pocket)
      }).eq('id', winner.id),
      supabase.from('players').update({
        active: false, bounty: 0, elim_by: winner.name, place: activePlayers.length
      }).eq('id', loser.id),
      supabase.from('eliminations').insert({
        tournament_id: tournament.id,
        winner_id: winner.id,
        loser_id: loser.id,
        winner_name: winner.name,
        loser_name: loser.name,
        pocket: split.pocket,
        on_head: split.onHead,
        loser_bounty_before: loser.bounty
      })
    ])

    if (r1.error || r2e.error || r3.error) {
      show('Błąd zapisu – spróbuj ponownie')
    } else {
      show(`+${split.pocket} zł do kieszeni, +${split.onHead} zł na głowę!`)
    }

    setSelectedWinner(null)
    setSelectedLoser(null)
    winnerRef.current = null
    elimLock.current = false
    onRefresh()
  }

  // --- UNDO ---
  async function undoLastElim() {
    if (!eliminations.length) { show('Brak eliminacji do cofnięcia'); return }
    const last = [...eliminations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    const winner = players.find(p => p.id === last.winner_id)
    const loser = players.find(p => p.id === last.loser_id)
    if (!winner) { show('Nie można znaleźć eliminującego'); return }
    if (!loser) { show('Nie można znaleźć wyeliminowanego'); return }

    await Promise.all([
      supabase.from('players').update({
        bounty: r2(winner.bounty - last.on_head),
        pocket_bounty: r2(winner.pocket_bounty - last.pocket)
      }).eq('id', winner.id),
      supabase.from('players').update({
        active: true, bounty: last.loser_bounty_before, elim_by: null, place: null
      }).eq('id', loser.id),
      supabase.from('eliminations').delete().eq('id', last.id)
    ])

    show(`Cofnięto: ${loser.name} wraca do turnieju`)
    onRefresh()
  }

  // --- RENDER ---
  if (!tournament || showSetup) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <ToastContainer />
      <div className="modal" style={{ maxWidth: 480 }}>
        <h2>Nowy turniej</h2>
        <div className="field">
          <label>Startowe bounty (zł)</label>
          <input type="number" value={setupForm.initBounty} min="1"
            onChange={e => setSetupForm(f => ({ ...f, initBounty: +e.target.value }))} />
        </div>
        <div className="field">
          <label>Najmniejszy nominał żetonu (zł)</label>
          <input type="number" value={setupForm.minChip} min="1"
            onChange={e => setSetupForm(f => ({ ...f, minChip: +e.target.value }))} />
        </div>
        <button className="btn btn-gold btn-full" onClick={createTournament}>Utwórz turniej →</button>
        {tournament && (
          <button className="btn btn-full" style={{ marginTop: 8 }} onClick={() => setShowSetup(false)}>Anuluj</button>
        )}
      </div>
    </div>
  )

  const currentTable = validTables.includes(viewTable) ? viewTable : validTables[0]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem' }}>
      <ToastContainer />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: 'var(--gold-light)' }}>
          ♠ PKO Tracker <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'Inter, sans-serif' }}>TD</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--success)' }}>{activePlayers.length} aktywnych</span>
          <button className="btn" style={{ fontSize: 12, padding: '5px 10px' }} onClick={undoLastElim}>↩ Cofnij</button>
          <button className="btn" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setShowSetup(true)}>Nowy turniej</button>
          <button className="btn" style={{ fontSize: 12, padding: '5px 10px' }} onClick={onLogout}>Wyloguj</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: 8, flexWrap: 'wrap' }}>
        {[['tables','Stoły'],['players','Gracze'],['log','Historia'],['add','Dodaj gracza']].map(([id, label]) => (
          <button key={id} className="btn" onClick={() => setTab(id)}
            style={{ fontSize: 13, background: tab === id ? 'rgba(201,168,76,0.12)' : 'var(--bg2)', color: tab === id ? 'var(--gold-light)' : 'var(--text2)', borderColor: tab === id ? 'var(--gold-dark)' : 'var(--border)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: '1rem' }}>
        {[
          ['Aktywni gracze', activePlayers.length],
          ['Pula bounty', r2(activePlayers.reduce((s, p) => s + p.bounty, 0)) + ' zł'],
          ['Wypłacono', r2(players.reduce((s, p) => s + p.pocket_bounty, 0)) + ' zł'],
          ['Eliminacje', eliminations.length],
        ].map(([label, val]) => (
          <div key={label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold-light)' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* TABLES */}
      {tab === 'tables' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
            {validTables.map(t => (
              <button key={t} className="btn" onClick={() => setViewTable(t)}
                style={{ background: currentTable === t ? 'rgba(201,168,76,0.12)' : 'var(--bg2)', borderColor: currentTable === t ? 'var(--gold)' : 'var(--border)', color: currentTable === t ? 'var(--gold-light)' : 'var(--text2)' }}>
                Stół {t} ({activePlayers.filter(p => p.table_num === t).length}/9)
              </button>
            ))}
          </div>

          <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Stół {currentTable}</span>
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text2)', textTransform: 'none', letterSpacing: 0 }}>
              {!selectedWinner ? 'Kliknij eliminującego' : !selectedLoser ? 'Kliknij wyeliminowanego' : 'Przetwarzanie...'}
            </span>
          </div>

          <SeatGrid
            players={activePlayers}
            tableNum={currentTable}
            onSeatClick={handleSeatClick}
            selectedWinner={selectedWinner}
            selectedLoser={selectedLoser}
          />

          {selectedWinner && !selectedLoser && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button className="btn btn-danger btn-full" onClick={() => confirmElim()}>
                Zatwierdź eliminację
              </button>
              <button className="btn" onClick={() => { winnerRef.current = null; setSelectedWinner(null); setSelectedLoser(null) }}>
                Anuluj
              </button>
            </div>
          )}
        </div>
      )}

      {/* PLAYERS */}
      {tab === 'players' && (
        <div>
          <div className="section-title">Ranking bounty</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...activePlayers].sort((a, b) => b.bounty - a.bounty).map((p, i) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: 10, padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>{i + 1}</div>
                <div>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  {p.rebuys > 1 && <span className="badge badge-warning" style={{ marginLeft: 6 }}>R{p.rebuys}</span>}
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>St.{p.table_num} / msc.{p.seat}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>{r2(p.bounty)} zł</div>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--success)' }}>+{r2(p.pocket_bounty)} zł</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOG */}
      {tab === 'log' && (
        <div>
          <div className="section-title">Historia eliminacji</div>
          {eliminations.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Brak eliminacji</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[...eliminations].reverse().map(e => (
              <div key={e.id} style={{ padding: '8px 12px', background: 'var(--bg3)', borderRadius: 6, borderLeft: '2px solid var(--gold-dark)', fontSize: 13 }}>
                <strong style={{ color: 'var(--gold-light)' }}>{e.winner_name}</strong>
                <span style={{ color: 'var(--text2)' }}> eliminuje </span>
                <strong style={{ color: 'var(--danger)' }}>{e.loser_name}</strong>
                <span style={{ color: 'var(--text3)' }}> → +{e.pocket} zł do kieszeni, +{e.on_head} zł na głowę</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD */}
      {tab === 'add' && (
        <div style={{ maxWidth: 480 }}>
          <div className="section-title">Dodaj gracza</div>
          <form onSubmit={addPlayer}>
            <div className="field">
              <label>Imię / nick</label>
              <input value={addForm.name} placeholder="Imię gracza"
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>Stół</label>
                <select value={addForm.tableNum} onChange={e => setAddForm(f => ({ ...f, tableNum: e.target.value }))}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i+1} value={i+1}>Stół {i+1}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Miejsce (1–9)</label>
                <input type="number" min="1" max="9" value={addForm.seat} placeholder="1–9"
                  onChange={e => setAddForm(f => ({ ...f, seat: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label>Bounty (zł) – domyślnie {tournament.init_bounty} zł</label>
              <input type="number" value={addForm.bounty} placeholder={tournament.init_bounty}
                onChange={e => setAddForm(f => ({ ...f, bounty: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-gold btn-full">Dodaj gracza</button>
          </form>
        </div>
      )}
    </div>
  )
}
