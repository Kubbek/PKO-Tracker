import { useState } from 'react'
import { setTheme, getTheme, THEMES } from '../lib/theme'

const THEME_CONFIG = {
  amber: { color: '#f59e0b', bg: '#080a0d', label: 'Neon' },
  light: { color: '#b45309', bg: '#faf9f7', label: 'Biały' },
  mega:  { color: '#d4a853', bg: '#04090f', label: 'Mega' },
}

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState(getTheme())

  function handleSet(t) {
    setTheme(t)
    setCurrent(t)
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} title="Zmień motyw">
      {THEMES.map(t => {
        const cfg = THEME_CONFIG[t]
        const isActive = current === t
        return (
          <button
            key={t}
            onClick={() => handleSet(t)}
            aria-label={`Motyw: ${cfg.label}`}
            title={cfg.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 20,
              border: `1px solid ${isActive ? cfg.color : 'var(--border2)'}`,
              background: isActive ? `${cfg.color}18` : 'transparent',
              color: isActive ? cfg.color : 'var(--text2)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.3px',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: cfg.color,
              display: 'inline-block',
              opacity: isActive ? 1 : 0.45,
              flexShrink: 0,
            }} />
            {cfg.label}
          </button>
        )
      })}
    </div>
  )
}
