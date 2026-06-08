import { r2 } from '../lib/bounty'

export default function SeatGrid({ players, tableNum, onSeatClick, onSeatRightClick, onDragStart, onDrop, selectedWinner, selectedLoser, readOnly = false }) {
  const seats = Array.from({ length: 9 }, (_, i) => i + 1)
  const tablePlayers = players.filter(p => p.table_num === tableNum && p.active)

  return (
    <div className="seat-felt">
      {seats.map(s => {
        const p = tablePlayers.find(pp => pp.seat === s)
        const isWinner = p && selectedWinner === p.id
        const isLoser  = p && selectedLoser  === p.id

        if (p) return (
          <div key={s}
            className={`seat-cell occupied${isWinner?' pick-winner':''}${isLoser?' pick-loser':''}`}
            draggable={!readOnly}
            onClick={() => !readOnly && onSeatClick?.(p)}
            onContextMenu={e => { e.preventDefault(); !readOnly && onSeatRightClick?.(p, e) }}
            onDragStart={() => onDragStart?.(p)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop?.(tableNum, s)}
          >
            <div className="seat-player">
              <div className="sp-name">
                {p.name}
                {p.rebuys > 1 && <span className="badge badge-accent" style={{ marginLeft: 5, fontSize: 8 }}>R{p.rebuys}</span>}
              </div>
              <div className="sp-bounty">{r2(p.bounty)} zł</div>
              {p.pocket_bounty > 0 && <div className="sp-pocket">+{r2(p.pocket_bounty)} zł</div>}
            </div>
            <div className="seat-num">{s}</div>
          </div>
        )

        return (
          <div key={s} className="seat-cell"
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop?.(tableNum, s)}
          >
            <div className="seat-empty"><button>+</button></div>
            <div className="seat-num">{s}</div>
          </div>
        )
      })}
    </div>
  )
}
