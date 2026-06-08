import { r2 } from '../lib/bounty'

export default function OvalTable({ players, tableNum, onSeatClick, onSeatRightClick, onDragStart, onDrop, selectedWinner, selectedLoser }) {
  const seats = Array.from({ length: 9 }, (_, i) => i + 1)
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)

  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '58%', margin: '4px 0 8px' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--felt)', border: '3px solid var(--accent-dim)' }}>
        <div style={{ position: 'absolute', inset: '12%', borderRadius: '50%', border: '1px solid var(--accent-border)', opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--num-font,Bebas Neue,sans-serif)', fontSize: 20, letterSpacing: 2, color: 'var(--accent-border)', pointerEvents: 'none', userSelect: 'none', textAlign: 'center' }}>
          STÓŁ {tableNum}
        </div>

        {seats.map(s => {
          const angle = ((s - 1) / 9) * 2 * Math.PI - Math.PI / 2
          const x = 50 + 44 * Math.cos(angle)
          const y = 50 + 38 * Math.sin(angle)
          const p = tablePlayers.find(pp => pp.seat === s)
          const isWinner = p && selectedWinner === p.id
          const isLoser  = p && selectedLoser  === p.id

          const borderColor = isWinner ? 'var(--green)' : isLoser ? 'var(--red)' : p ? 'var(--border2)' : 'var(--border)'
          const bg = isWinner ? 'var(--green-bg)' : isLoser ? 'var(--red-bg)' : p ? 'var(--bg3)' : 'var(--bg2)'

          return (
            <div key={s} style={{
              position: 'absolute', left: x + '%', top: y + '%',
              transform: 'translate(-50%,-50%)', width: 72,
              background: bg, border: `1.5px solid ${borderColor}`,
              borderRadius: 8, padding: '5px 5px 4px', textAlign: 'center',
              cursor: p ? 'pointer' : 'default', transition: 'all 0.15s', zIndex: 2,
            }}
              onClick={() => p && onSeatClick?.(p)}
              onContextMenu={e => { e.preventDefault(); p && onSeatRightClick?.(p, e) }}
              draggable={!!p}
              onDragStart={() => p && onDragStart?.(p)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop?.(tableNum, s)}
            >
              <div style={{ position: 'absolute', top: 2, right: 4, fontSize: 9, fontWeight: 700, color: 'var(--text3)' }}>{s}</div>
              {p ? (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isWinner ? 'var(--green)' : isLoser ? 'var(--red)' : 'var(--text)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}{p.rebuys > 1 && <span style={{ fontSize: 8, color: 'var(--accent)', marginLeft: 2, fontWeight: 700 }}>R{p.rebuys}</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--num-font,Bebas Neue,sans-serif)', fontSize: 13, color: isWinner ? 'var(--green)' : isLoser ? 'var(--red)' : 'var(--accent)', letterSpacing: 0.5, marginTop: 2 }}>
                    {r2(p.bounty)} zł
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 16, color: 'var(--border2)', lineHeight: 1, marginTop: 4 }}>+</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
