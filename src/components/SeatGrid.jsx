import { useState } from 'react'

function r2(n) { return Math.round(n * 100) / 100 }

export default function SeatGrid({ players, tableNum, onSeatClick, selectedWinner, selectedLoser, readOnly = false }) {
  const seats = Array.from({ length: 9 }, (_, i) => i + 1)
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 8,
      padding: 10,
      background: '#162e16',
      borderRadius: 8
    }}>
      {seats.map(s => {
        const p = tablePlayers.find(pp => pp.seat === s)
        const isWinner = p && selectedWinner === p.id
        const isLoser = p && selectedLoser === p.id

        if (p) {
          return (
            <div
              key={s}
              onClick={() => !readOnly && onSeatClick && onSeatClick(p)}
              style={{
                border: `${isWinner || isLoser ? 2 : 1}px solid ${isWinner ? '#5dba6e' : isLoser ? '#e06060' : 'rgba(180,150,60,0.25)'}`,
                borderRadius: 6,
                minHeight: 72,
                position: 'relative',
                background: isWinner ? '#0d2e12' : isLoser ? '#2e0d0d' : '#1e1e1c',
                cursor: readOnly ? 'default' : 'pointer',
                transition: 'all 0.15s',
                padding: '18px 8px 6px',
                outline: isWinner ? '2px solid #5dba6e' : isLoser ? '2px solid #e06060' : 'none',
                outlineOffset: -1,
              }}
            >
              <span style={{
                position: 'absolute', top: 4, left: 7,
                fontSize: 10, fontWeight: 700,
                color: isWinner ? '#5dba6e' : isLoser ? '#e06060' : '#6b5e3a'
              }}>{s}</span>
              <div style={{ fontSize: 12, fontWeight: 600, color: isWinner ? '#5dba6e' : isLoser ? '#e06060' : '#f0e6c8', lineHeight: 1.2 }}>
                {p.name}
                {p.rebuys > 1 && <span style={{ fontSize: 9, background: '#2e1f06', color: '#c99a3a', padding: '0 4px', borderRadius: 3, marginLeft: 3 }}>R{p.rebuys}</span>}
              </div>
              <div style={{ fontSize: 10, color: '#8a6a1e', fontWeight: 600, marginTop: 2 }}>{r2(p.bounty)} zł</div>
              {p.pocket_bounty > 0 && <div style={{ fontSize: 10, color: '#5dba6e', marginTop: 1 }}>+{r2(p.pocket_bounty)} zł</div>}
            </div>
          )
        }

        return (
          <div
            key={s}
            style={{
              border: '1px dashed rgba(180,150,60,0.15)',
              borderRadius: 6,
              minHeight: 72,
              position: 'relative',
              background: '#142414',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ position: 'absolute', top: 4, left: 7, fontSize: 10, color: '#4a3e1a', fontWeight: 700 }}>{s}</span>
            <span style={{ fontSize: 18, color: '#2a3a2a' }}>—</span>
          </div>
        )
      })}
    </div>
  )
}
