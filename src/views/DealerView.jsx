import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { chipSplit, r2 } from '../lib/bounty'
import { useToast } from '../lib/useToast'
import SeatGrid from '../components/SeatGrid'
import OvalTable from '../components/OvalTable'
import ThemeSwitcher from '../components/ThemeSwitcher'

export default function DealerView({ tournament, onRefresh, onLogout, tableNum }) {
  const { show, ToastContainer } = useToast()
  const [selectedWinner, setSelectedWinner] = useState(null)
  const [selectedLoser, setSelectedLoser] = useState(null)
  const winnerRef = useRef(null)
  const elimLock = useRef(false)
  const [tableView, setTableView] = useState('oval')

  const players = tournament?.players || []
  const eliminations = tournament?.eliminations || []
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)
  const tableElims = eliminations.filter(e => {
    const w = players.find(p => p.id === e.winner_id)
    const l = players.find(p => p.id === e.loser_id)
    return w?.table_num === tableNum || l?.table_num === tableNum
  })

  function handleSeatClick(player) {
    if (!winnerRef.current) { winnerRef.current = player.id; setSelectedWinner(player.id); setSelectedLoser(null) }
    else if (player.id === winnerRef.current) { winnerRef.current = null; setSelectedWinner(null); setSelectedLoser(null) }
    else if (!selectedLoser) {
      const wid = winnerRef.current, lid = player.id; setSelectedLoser(lid)
      setTimeout(() => { confirmElim(wid, lid); winnerRef.current = null }, 280)
    } else { winnerRef.current = null; setSelectedWinner(null); setSelectedLoser(null) }
  }

  async function confirmElim(wid, lid) {
    const w = wid ?? selectedWinner, l = lid ?? selectedLoser
    if (!w || !l || w === l) return
    if (elimLock.current) return; elimLock.current = true
    const winner = players.find(p => p.id === w), loser = players.find(p => p.id === l)
    if (!winner || !loser) { elimLock.current = false; return }
    const split = chipSplit(loser.bounty, tournament.min_chip)
    await Promise.all([
      supabase.from('players').update({ bounty: r2(winner.bounty + split.onHead), pocket_bounty: r2(winner.pocket_bounty + split.pocket) }).eq('id', winner.id),
      supabase.from('players').update({ active: false, bounty: 0, elim_by: winner.name, place: players.filter(p => p.active).length }).eq('id', loser.id),
      supabase.from('eliminations').insert({ tournament_id: tournament.id, winner_id: winner.id, loser_id: loser.id, winner_name: winner.name, loser_name: loser.name, pocket: split.pocket, on_head: split.onHead, loser_bounty_before: loser.bounty })
    ])
    show(`${winner.name} → +${split.pocket} zł`)
    setSelectedWinner(null); setSelectedLoser(null); winnerRef.current = null; elimLock.current = false; onRefresh()
  }

  if (!tournament) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text2)' }}>
      Oczekiwanie na start turnieju...
    </div>
  )

  const winnerPlayer = players.find(p => p.id === selectedWinner)
  const loserPlayer = players.find(p => p.id === selectedLoser)

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '1rem 1.25rem' }}>
      <ToastContainer />

      <div className="app-header">
        <div>
          <span className="app-logo" style={{ fontSize: 20 }}>STÓŁ {tableNum}</span>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{tablePlayers.length} / 9 graczy</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeSwitcher />
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={onLogout}>Wyloguj</button>
        </div>
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: '1rem', fontSize: 14, textAlign: 'center', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 500 }}>
        {!selectedWinner && <span style={{ color: 'var(--text2)' }}>Kliknij gracza który eliminuje</span>}
        {selectedWinner && !selectedLoser && <><span style={{ color: 'var(--green)', fontWeight: 700 }}>{winnerPlayer?.name}</span><span style={{ color: 'var(--text3)' }}>eliminuje...</span></>}
        {selectedWinner && selectedLoser && <><span style={{ color: 'var(--green)', fontWeight: 700 }}>{winnerPlayer?.name}</span><span style={{ color: 'var(--text3)', margin: '0 6px' }}>→</span><span style={{ color: 'var(--red)', fontWeight: 700 }}>{loserPlayer?.name}</span></>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 3, marginBottom: 8 }}>
        {[['oval','⬭'],['grid','⊞']].map(([v,icon]) => (
          <button key={v} onClick={() => setTableView(v)}
            style={{ padding: '3px 9px', fontSize: 13, border: '1px solid ' + (tableView===v ? 'var(--accent)' : 'var(--border)'), background: tableView===v ? 'var(--accent-bg)' : 'transparent', color: tableView===v ? 'var(--accent)' : 'var(--text2)', borderRadius: 6, cursor: 'pointer' }}>
            {icon}
          </button>
        ))}
      </div>
      {tableView === 'oval'
        ? <OvalTable players={players} tableNum={tableNum} onSeatClick={handleSeatClick} selectedWinner={selectedWinner} selectedLoser={selectedLoser} />
        : <SeatGrid players={players} tableNum={tableNum} onSeatClick={handleSeatClick} selectedWinner={selectedWinner} selectedLoser={selectedLoser} />
      }

      {selectedWinner && !selectedLoser && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-danger btn-full" onClick={() => confirmElim()}>Zatwierdź eliminację</button>
          <button className="btn btn-ghost" onClick={() => { winnerRef.current = null; setSelectedWinner(null); setSelectedLoser(null) }}>✕</button>
        </div>
      )}

      {tableElims.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="section-title">Historia – stół {tableNum}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }} className="scroll-y">
            {[...tableElims].reverse().slice(0, 10).map(e => (
              <div key={e.id} className="log-entry">
                <span className="log-amount">+{e.pocket} zł</span>
                <strong style={{ color: 'var(--accent2)' }}>{e.winner_name}</strong>
                <span style={{ color: 'var(--text3)' }}> → </span>
                <strong style={{ color: 'var(--red)' }}>{e.loser_name}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
