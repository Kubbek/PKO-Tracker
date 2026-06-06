import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { chipSplit, r2 } from '../lib/bounty'
import { useToast } from '../lib/useToast'
import SeatGrid from '../components/SeatGrid'

export default function DealerView({ tournament, onRefresh, onLogout, tableNum }) {
  const { show, ToastContainer } = useToast()
  const [selectedWinner, setSelectedWinner] = useState(null)
  const [selectedLoser, setSelectedLoser] = useState(null)

  const players = tournament?.players || []
  const eliminations = tournament?.eliminations || []
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)
  const tableElims = eliminations.filter(e => {
    const w = players.find(p => p.id === e.winner_id)
    const l = players.find(p => p.id === e.loser_id)
    return (w?.table_num === tableNum) || (l?.table_num === tableNum)
  })

  function handleSeatClick(player) {
    if (!selectedWinner) {
      setSelectedWinner(player.id)
    } else if (player.id === selectedWinner) {
      setSelectedWinner(null)
      setSelectedLoser(null)
    } else if (!selectedLoser) {
      setSelectedLoser(player.id)
      setTimeout(() => confirmElim(selectedWinner, player.id), 300)
    } else {
      setSelectedWinner(null)
      setSelectedLoser(null)
    }
  }

  async function confirmElim(winnerId, loserId) {
    const wid = winnerId || selectedWinner
    const lid = loserId || selectedLoser
    if (!wid || !lid || wid === lid) return

    const winner = players.find(p => p.id === wid)
    const loser = players.find(p => p.id === lid)
    if (!winner || !loser) return

    const split = chipSplit(loser.bounty, tournament.min_chip)

    await supabase.from('players').update({
      bounty: r2(winner.bounty + split.onHead),
      pocket_bounty: r2(winner.pocket_bounty + split.pocket)
    }).eq('id', winner.id)

    await supabase.from('players').update({
      active: false, bounty: 0, elim_by: winner.name,
      place: tablePlayers.length
    }).eq('id', loser.id)

    await supabase.from('eliminations').insert({
      tournament_id: tournament.id,
      winner_id: winner.id,
      loser_id: loser.id,
      winner_name: winner.name,
      loser_name: loser.name,
      pocket: split.pocket,
      on_head: split.onHead,
      loser_bounty_before: loser.bounty
    })

    show(`${winner.name} eliminuje ${loser.name} · +${split.pocket} zł`)
    setSelectedWinner(null)
    setSelectedLoser(null)
    onRefresh()
  }

  if (!tournament) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text2)' }}>
      Oczekiwanie na start turnieju...
    </div>
  )

  const winnerPlayer = players.find(p => p.id === selectedWinner)
  const loserPlayer = players.find(p => p.id === selectedLoser)

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '1rem' }}>
      <ToastContainer />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: 'var(--gold-light)' }}>
            ♠ Stół {tableNum}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{tablePlayers.length} / 9 graczy</div>
        </div>
        <button className="btn" style={{ fontSize: 12, padding: '5px 10px' }} onClick={onLogout}>Wyloguj</button>
      </div>

      {/* Status hint */}
      <div style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: '1rem', fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>
        {!selectedWinner && 'Kliknij gracza który eliminuje'}
        {selectedWinner && !selectedLoser && <>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{winnerPlayer?.name}</span> eliminuje...
        </>}
        {selectedWinner && selectedLoser && <>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{winnerPlayer?.name}</span>
          {' → '}
          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{loserPlayer?.name}</span>
        </>}
      </div>

      <SeatGrid
        players={players}
        tableNum={tableNum}
        onSeatClick={handleSeatClick}
        selectedWinner={selectedWinner}
        selectedLoser={selectedLoser}
      />

      {selectedWinner && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-danger btn-full" onClick={() => confirmElim()}>
            Zatwierdź eliminację
          </button>
          <button className="btn" onClick={() => { setSelectedWinner(null); setSelectedLoser(null) }}>✕</button>
        </div>
      )}

      {/* Recent elims at this table */}
      {tableElims.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="section-title">Historia – stół {tableNum}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto' }}>
            {[...tableElims].reverse().slice(0, 10).map(e => (
              <div key={e.id} style={{ padding: '7px 10px', background: 'var(--bg3)', borderRadius: 6, borderLeft: '2px solid var(--gold-dark)', fontSize: 12 }}>
                <strong style={{ color: 'var(--gold-light)' }}>{e.winner_name}</strong>
                <span style={{ color: 'var(--text3)' }}> → </span>
                <strong style={{ color: 'var(--danger)' }}>{e.loser_name}</strong>
                <span style={{ color: 'var(--text3)' }}> · +{e.pocket} zł</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
