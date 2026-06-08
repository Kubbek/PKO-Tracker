import { r2 } from '../lib/bounty'

export default function OvalTable({ players, tableNum, onSeatClick, onSeatRightClick, onDragStart, onDrop, selectedWinner, selectedLoser, readOnly = false }) {
  const seats = Array.from({ length: 9 }, (_, i) => i + 1)
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      paddingBottom: '55%',
      margin: '8px 0 12px',
    }}>
      {/* Outer felt oval */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'var(--felt, #1c3a20)',
        border: '4px solid var(--accent-dim, #92400e)',
        boxSizing: 'border-box',
      }}>
        {/* Inner border ring */}
        <div style={{
          position: 'absolute',
          inset: '10%',
          borderRadius: '50%',
          border: '2px solid var(--accent-border, rgba(180,83,9,0.2))',
          pointerEvents: 'none',
        }} />

        {/* Table label */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Bebas Neue', 'DM Sans', sans-serif",
          fontSize: 'clamp(14px, 3vw, 24px)',
          letterSpacing: 3,
          color: 'var(--accent-border, rgba(180,83,9,0.3))',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}>
          STÓŁ {tableNum}
        </div>

        {/* Seats */}
        {seats.map(s => {
          const angle = ((s - 1) / 9) * 2 * Math.PI - Math.PI / 2
          const rx = 43, ry = 37
          const x = 50 + rx * Math.cos(angle)
          const y = 50 + ry * Math.sin(angle)
          const p = tablePlayers.find(pp => pp.seat === s)
          const isWinner = p && selectedWinner === p.id
          const isLoser  = p && selectedLoser  === p.id

          const borderColor = isWinner ? 'var(--green, #059669)'
            : isLoser  ? 'var(--red, #dc2626)'
            : p        ? 'var(--border2, rgba(0,0,0,0.16))'
            :             'var(--border, rgba(0,0,0,0.08))'

          const bg = isWinner ? 'var(--green-bg, rgba(5,150,105,0.08))'
            : isLoser  ? 'var(--red-bg, rgba(220,38,38,0.07))'
            : p        ? 'var(--bg3, #ffffff)'
            :             'var(--bg2, #f3f0ea)'

          return (
            <div
              key={s}
              style={{
                position: 'absolute',
                left: x + '%', top: y + '%',
                transform: 'translate(-50%, -50%)',
                width: 'clamp(56px, 8%, 76px)',
                background: bg,
                border: `2px solid ${borderColor}`,
                borderRadius: 8,
                padding: '5px 4px 4px',
                textAlign: 'center',
                cursor: p && !readOnly ? 'pointer' : 'default',
                transition: 'transform 0.15s, border-color 0.15s',
                zIndex: 2,
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              }}
              onClick={() => p && !readOnly && onSeatClick?.(p)}
              onContextMenu={e => { e.preventDefault(); p && !readOnly && onSeatRightClick?.(p, e) }}
              draggable={!!p && !readOnly}
              onDragStart={() => p && !readOnly && onDragStart?.(p)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => !readOnly && onDrop?.(tableNum, s)}
            >
              {/* Seat number */}
              <div style={{
                position: 'absolute', top: 2, right: 4,
                fontSize: 9, fontWeight: 700,
                color: 'var(--text3, #a8a29e)',
                lineHeight: 1,
              }}>{s}</div>

              {p ? (
                <>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: isWinner ? 'var(--green, #059669)'
                      : isLoser ? 'var(--red, #dc2626)'
                      : 'var(--text, #1c1917)',
                    lineHeight: 1.25,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    paddingTop: 2,
                  }}>
                    {p.name}
                    {p.rebuys > 1 && (
                      <span style={{ fontSize: 8, color: 'var(--accent, #b45309)', marginLeft: 2, fontWeight: 700 }}>
                        R{p.rebuys}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 13,
                    color: isWinner ? 'var(--green, #059669)'
                      : isLoser ? 'var(--red, #dc2626)'
                      : 'var(--accent, #b45309)',
                    letterSpacing: 0.5,
                    marginTop: 2,
                    lineHeight: 1,
                  }}>
                    {r2(p.bounty)} zł
                  </div>
                </>
              ) : (
                <div style={{
                  fontSize: 18, color: 'var(--text3, #a8a29e)',
                  lineHeight: 1, marginTop: 6, opacity: 0.5,
                }}>+</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
