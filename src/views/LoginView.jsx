import { useState } from 'react'
import { useToast } from '../lib/useToast'
import ThemeSwitcher from '../components/ThemeSwitcher'

export default function LoginView({ onLogin, tournament }) {
  const [role, setRole] = useState('spectator')
  const [table, setTable] = useState('1')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { show, ToastContainer } = useToast()

  function handleSubmit(e) {
    e.preventDefault()
    const ok = onLogin(role, table ? parseInt(table) : null, password)
    if (!ok) { setError('Nieprawidłowe hasło'); setTimeout(() => setError(''), 2000) }
  }

  const roles = [
    { id: 'td',        icon: '◈', label: 'Tournament Director', desc: 'Pełna kontrola' },
    { id: 'dealer',    icon: '◉', label: 'Dealer',              desc: 'Widok stołu' },
    { id: 'spectator', icon: '◎', label: 'Gracz / Widz',        desc: 'Tylko odczyt' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--body-bg)', padding: '1rem' }}>
      <ToastContainer />
      <div style={{ position: 'absolute', top: 16, right: 16 }}><ThemeSwitcher /></div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="app-logo" style={{ fontSize: 52, display: 'block' }}>PKO</div>
          <div style={{ fontFamily: 'var(--header-font)', fontSize: 13, letterSpacing: 6, color: 'var(--text2)', marginTop: 2, textTransform: 'uppercase' }}>Tracker</div>
          {tournament && (
            <div style={{ marginTop: 14, display: 'inline-flex' }}>
              <div className="live-badge"><div className="live-dot" />LIVE · {tournament.players?.filter(p => p.active).length || 0} graczy</div>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 18, padding: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1.5rem' }}>
            {roles.map(r => (
              <button key={r.id} type="button" onClick={() => { setRole(r.id); setPassword('') }}
                style={{ padding: '14px 8px', border: `1px solid ${role === r.id ? 'var(--accent)' : 'var(--border)'}`, background: role === r.id ? 'var(--accent-bg)' : 'var(--bg2)', color: role === r.id ? 'var(--accent2)' : 'var(--text2)', borderRadius: 12, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>{r.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {role === 'dealer' && (
              <div className="field">
                <label>Numer stołu</label>
                <select value={table} onChange={e => setTable(e.target.value)}>
                  {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>Stół {i + 1}</option>)}
                </select>
              </div>
            )}
            {(role === 'td' || role === 'dealer') && (
              <div className="field">
                <label>Hasło</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
              </div>
            )}
            {error && <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', marginBottom: '0.75rem', fontWeight: 600 }}>{error}</div>}
            <button type="submit" className="btn btn-accent btn-full" style={{ fontSize: 14, letterSpacing: 1 }}>Wejdź</button>
          </form>
        </div>
      </div>
    </div>
  )
}
