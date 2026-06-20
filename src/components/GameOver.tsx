import type { Player } from '../lib/constants'

interface GameOverProps {
  winner: Player | null
  isDraw: boolean
  myPlayer: Player | null
  mode: 'local' | 'remote'
  onRematch: () => void
  onMenu: () => void
}

const P_COLOR: Record<number, string> = { 1: '#E63946', 2: '#F4A621' }

export function GameOver({ winner, isDraw, myPlayer, mode, onRematch, onMenu }: GameOverProps) {
  let headline = ''
  let sub = ''
  let emoji = ''

  if (isDraw) {
    headline = 'Draw!'
    sub = 'The board is full. No winner this time.'
    emoji = '🤝'
  } else if (winner) {
    if (mode === 'remote' && myPlayer) {
      const won = winner === myPlayer
      headline = won ? 'You Win!' : 'You Lose'
      sub = won ? 'Four in a row — well played.' : 'Better luck next round.'
      emoji = won ? '🏆' : '💀'
    } else {
      headline = `Player ${winner} Wins!`
      sub = 'Four in a row.'
      emoji = '🎉'
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-10 px-4 text-center">
      <div className="text-6xl">{emoji}</div>

      <div>
        <h2
          className="text-4xl font-black tracking-tight"
          style={{ color: winner ? P_COLOR[winner] : '#94a3b8' }}
        >
          {headline}
        </h2>
        <p className="text-slate-400 mt-2">{sub}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRematch}
          className="px-8 py-3 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-600
            active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
            focus:ring-offset-slate-900 transition-all"
        >
          Play Again
        </button>
        <button
          onClick={onMenu}
          className="px-6 py-3 rounded-xl font-medium text-slate-400 border border-slate-700
            hover:border-slate-500 hover:text-slate-200 active:scale-95 focus:outline-none
            focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900
            transition-all"
        >
          Menu
        </button>
      </div>
    </div>
  )
}
