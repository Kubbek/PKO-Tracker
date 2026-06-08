import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import LoginView from './views/LoginView'
import TDView from './views/TDView'
import DealerView from './views/DealerView'
import SpectatorView from './views/SpectatorView'

const PASSWORDS = {
  td: 'td2024',
  dealer: 'dealer2024',
}

export default function App() {
  const [role, setRole] = useState(null)
  const [tableNum, setTableNum] = useState(null)
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadTournament = useCallback(async () => {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) { console.error('Load error:', error); setLoading(false); return }

    if (!tournaments || tournaments.length === 0) {
      setTournament(null)
      setLoading(false)
      return
    }

    const t = tournaments[0]

    const [{ data: players }, { data: eliminations }] = await Promise.all([
      supabase.from('players').select('*').eq('tournament_id', t.id).order('created_at'),
      supabase.from('eliminations').select('*').eq('tournament_id', t.id).order('created_at'),
    ])

    setTournament({ ...t, players: players || [], eliminations: eliminations || [] })
    setLoading(false)
  }, [])

  useEffect(() => {
    loadTournament()

    // Unique channel name to avoid multi-tab conflicts
    const channelName = 'tournament-' + Math.random().toString(36).slice(2)
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, loadTournament)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, loadTournament)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eliminations' }, loadTournament)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [loadTournament])

  function handleLogin(selectedRole, selectedTable, password) {
    if (selectedRole === 'spectator') {
      setRole('spectator')
      setTableNum(selectedTable)
      return true
    }
    if (password === PASSWORDS[selectedRole]) {
      setRole(selectedRole)
      setTableNum(selectedTable)
      return true
    }
    return false
  }

  function handleLogout() {
    setRole(null)
    setTableNum(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: 'var(--header-font, Cinzel, serif)', fontSize: 24, color: 'var(--accent)' }}>PKO Tracker</div>
      <div style={{ color: 'var(--text2)', fontSize: 14 }}>Łączenie z bazą...</div>
    </div>
  )

  if (!role) return <LoginView onLogin={handleLogin} tournament={tournament} />

  const props = { tournament, onRefresh: loadTournament, onLogout: handleLogout, tableNum }

  if (role === 'td') return <TDView {...props} />
  if (role === 'dealer') return <DealerView {...props} />
  if (role === 'spectator') return <SpectatorView {...props} />
}
