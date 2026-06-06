import { useState } from 'react'
import { useToast } from '../lib/useToast'

export default function LoginView({ onLogin, tournament }) {
  const [role, setRole] = useState('spectator')
  const [table, setTable] = useState('1')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { show, ToastContainer } = useToast()

  function handleSubmit(e) {
    e.preventDefault()
    const ok = onLogin(role, table ? parseInt(table) : null, password)
    if (!ok) {
      setError('Nieprawidłowe hasło')
      setTimeout(() => setError(''), 2000)
    }
  }

  const needsPassword = role === 'td' || role === 'dealer'
  const needsTable = role === 'dealer'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1a2e1a 0%, #0a120a 100%)',
      padding: '1rem'
    }}>
      <ToastContainer />
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 32, fontWeight: 700, color: 'var(--gold-light)', letterSpacing: 2 }}>
            ♠ PKO Tracker
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
            Progressive Knockout Tournament
          </div>
          {tournament && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--success)', background: 'var(--success-bg)', padding: '4px 12px', borderRadius: 20, display: 'inline-block' }}>
              Turniej aktywny · {tournament.players?.filter(p => p.active).length || 0} graczy
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ background: 'var(--bg3)', border: '1px solid var(--gold-dark)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold-light)', fontSize: 16, marginBottom: '1.25rem', textAlign: 'center' }}>
            Wybierz widok
          </h2>

          {/* Role selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1.25rem' }}>
            {[
              { id: 'td', label: 'Tournament Director', icon: '👑' },
              { id: 'dealer', label: 'Dealer', icon: '🃏' },
              { id: 'spectator', label: 'Gracz / Widz', icon: '👁' },
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => { setRole(r.id); setPassword('') }}
                style={{
                  padding: '12px 8px',
                  border: `1px solid ${role === r.id ? 'var(--gold)' : 'var(--border)'}`,
                  background: role === r.id ? 'rgba(201,168,76,0.12)' : 'var(--bg2)',
                  color: role === r.id ? 'var(--gold-light)' : 'var(--text2)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{r.icon}</div>
                {r.label}
              </button>
            ))}
          </div>

          {needsTable && (
            <div className="field">
              <label>Numer stołu</label>
              <select value={table} onChange={e => setTable(e.target.value)}>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i+1} value={i+1}>Stół {i+1}</option>
                ))}
              </select>
            </div>
          )}

          {needsPassword && (
            <div className="field">
              <label>Hasło</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Wpisz hasło..."
                autoFocus
              />
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginBottom: '0.75rem' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-gold btn-full" style={{ marginTop: 4 }}>
            Wejdź →
          </button>
        </form>
      </div>
    </div>
  )
}
