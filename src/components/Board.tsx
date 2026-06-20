import { useEffect, useRef } from 'react'
import { COLS, ROWS, type Board, type Player } from '../lib/constants'

interface BoardProps {
  board: Board
  winCells: [number, number][]
  currentTurn: Player
  myPlayer: Player | null
  isMyTurn: boolean
  onDrop: (col: number) => void
  disabled: boolean
  animatingCol: number | null
}

export function BoardComponent({
  board, winCells, currentTurn, myPlayer, isMyTurn, onDrop, disabled, animatingCol
}: BoardProps) {
  const winSet = new Set(winCells.map(([r, c]) => `${r},${c}`))
  const hoverColRef = useRef<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const canInteract = !disabled && isMyTurn

  // Hover indicator via CSS custom property
  const setHoverCol = (col: number | null) => {
    hoverColRef.current = col
    svgRef.current?.style.setProperty('--hover-col', col !== null ? String(col) : '-1')
  }

  useEffect(() => {
    svgRef.current?.style.setProperty('--hover-col', '-1')
  }, [])

  const CELL = 72
  const PAD = 12
  const W = COLS * CELL + PAD * 2
  const H = ROWS * CELL + PAD * 2 + 48 // extra top for drop indicator

  const cx = (col: number) => PAD + col * CELL + CELL / 2
  const cy = (row: number) => 48 + PAD + row * CELL + CELL / 2
  const R = CELL * 0.38

  const playerColor = (p: number) => p === 1 ? '#E63946' : '#F4A621'
  const playerGlow = (p: number) => p === 1 ? '#FF6B6B' : '#FFD166'

  return (
    <div className="relative select-none" aria-label="Connect Four board">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[504px] mx-auto drop-shadow-2xl"
        role="grid"
        aria-label="game board"
        style={{ touchAction: 'none' }}
        onMouseLeave={() => setHoverCol(null)}
      >
        <defs>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-amber">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-win">
            <feGaussianBlur stdDeviation="8" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="void-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a1a2e"/>
            <stop offset="100%" stopColor="#0a0a14"/>
          </radialGradient>
          <clipPath id="board-clip">
            <rect x={0} y={48} width={W} height={H - 48} rx="12"/>
          </clipPath>
        </defs>

        {/* Drop zone — invisible click targets above board */}
        {Array.from({ length: COLS }, (_, col) => (
          <rect
            key={`drop-${col}`}
            x={PAD + col * CELL}
            y={0}
            width={CELL}
            height={48}
            fill="transparent"
            className={canInteract ? 'cursor-pointer' : 'cursor-default'}
            onClick={() => canInteract && onDrop(col)}
            onMouseEnter={() => canInteract && setHoverCol(col)}
            aria-label={`Drop in column ${col + 1}`}
            role="button"
            tabIndex={canInteract ? 0 : -1}
            onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && canInteract) onDrop(col) }}
          />
        ))}

        {/* Drop indicator triangle */}
        {Array.from({ length: COLS }, (_, col) => (
          <g key={`ind-${col}`}>
            <polygon
              points={`${cx(col) - 9},6 ${cx(col) + 9},6 ${cx(col)},26`}
              fill={playerColor(currentTurn)}
              opacity={0}
              className="transition-opacity duration-150"
              style={{
                opacity: canInteract && hoverColRef.current === col ? 1 : 0,
              }}
            />
          </g>
        ))}

        {/* Board background */}
        <rect x={0} y={48} width={W} height={H - 48} rx="12" fill="#1B4FD8"/>

        {/* Cells */}
        {board.map((row, ri) =>
          row.map((cell, ci) => {
            const x = cx(ci)
            const y = cy(ri)
            const isWin = winSet.has(`${ri},${ci}`)
            const isAnimating = animatingCol === ci && ri === board.reduce((acc, r, idx) => r[ci] !== 0 ? idx : acc, -1)

            return (
              <g key={`${ri}-${ci}`}>
                {/* Void hole */}
                <circle cx={x} cy={y} r={R + 2} fill="#080c14"/>

                {/* Disc or empty */}
                {cell !== 0 ? (
                  <>
                    <circle
                      cx={x}
                      cy={y}
                      r={R}
                      fill={playerColor(cell)}
                      filter={isWin ? 'url(#glow-win)' : undefined}
                      className={isAnimating ? 'animate-drop' : undefined}
                    >
                      {isWin && (
                        <animate attributeName="opacity" values="1;0.6;1" dur="1s" repeatCount="indefinite"/>
                      )}
                    </circle>
                    {/* Inner shine */}
                    <circle
                      cx={x - R * 0.25}
                      cy={y - R * 0.25}
                      r={R * 0.3}
                      fill="white"
                      opacity={0.18}
                    />
                    {/* Win ring pulse */}
                    {isWin && (
                      <circle cx={x} cy={y} r={R} fill="none" stroke={playerGlow(cell)} strokeWidth="3">
                        <animate attributeName="r" values={`${R};${R + 10};${R}`} dur="1.2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="1.2s" repeatCount="indefinite"/>
                      </circle>
                    )}
                  </>
                ) : (
                  /* Star-like void sparkle on empty */
                  <circle cx={x} cy={y} r={R} fill="url(#void-bg)"/>
                )}

                {/* Column click target on board face */}
                <rect
                  x={PAD + ci * CELL}
                  y={48 + PAD + ri * CELL}
                  width={CELL}
                  height={CELL}
                  fill="transparent"
                  className={canInteract ? 'cursor-pointer' : 'cursor-default'}
                  onClick={() => canInteract && onDrop(ci)}
                  onMouseEnter={() => canInteract && setHoverCol(ci)}
                />
              </g>
            )
          })
        )}
      </svg>

      {/* Turn label below board */}
      {!winSet.size && (
        <div className="text-center mt-3 text-sm font-mono tracking-widest uppercase"
          style={{ color: playerColor(currentTurn) }}>
          {myPlayer
            ? isMyTurn ? '▸ Your turn' : '⏳ Opponent\'s turn'
            : `Player ${currentTurn}'s turn`}
        </div>
      )}
    </div>
  )
}
