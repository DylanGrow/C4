import { BoardComponent } from './components/Board'
import { GameOver } from './components/GameOver'
import { Menu } from './components/Menu'
import { SetupRequired } from './components/SetupRequired'
import { WaitingRoom } from './components/WaitingRoom'
import { useGame } from './hooks/useGame'

export default function App() {
  const { state, drop, startLocal, startCreate, startJoin, rematch, goMenu } = useGame()
  const {
    board, currentTurn, winner, isDraw, winCells,
    phase, mode, roomCode, myPlayer, error, animatingCol
  } = state

  const isMyTurn = mode === 'local' || myPlayer === currentTurn

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-8"
      style={{ background: 'linear-gradient(160deg, #0D1117 0%, #111827 60%, #0f172a 100%)' }}
    >
      <div className="w-full max-w-[540px] px-4">
        {/* Header — shown during play */}
        {(phase === 'playing' || phase === 'done') && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goMenu}
              className="text-slate-500 hover:text-slate-300 text-sm font-mono tracking-wide
                focus:outline-none focus:underline transition-colors"
              aria-label="Back to menu"
            >
              ← menu
            </button>
            {mode === 'remote' && roomCode && (
              <span className="text-slate-500 text-xs font-mono tracking-[0.2em]">
                {roomCode}
              </span>
            )}
            <div className="flex gap-2" aria-label="Players">
              <span
                className="w-4 h-4 rounded-full inline-block"
                style={{ background: '#E63946', boxShadow: myPlayer === 1 || mode === 'local' ? '0 0 8px #E63946' : undefined }}
                aria-label="Player 1 - Red"
              />
              <span
                className="w-4 h-4 rounded-full inline-block"
                style={{ background: '#F4A621', boxShadow: myPlayer === 2 || mode === 'local' ? '0 0 8px #F4A621' : undefined }}
                aria-label="Player 2 - Amber"
              />
            </div>
          </div>
        )}

        {/* Phase routing */}
        {phase === 'menu' && (
          <Menu
            onLocal={startLocal}
            onCreate={() => void startCreate()}
            onJoin={code => void startJoin(code)}
            error={error}
            loading={false}
          />
        )}

        {phase === 'creating' && (
          <div className="text-center text-slate-400 py-20 font-mono">Creating room…</div>
        )}

        {phase === 'joining' && (
          <div className="text-center text-slate-400 py-20 font-mono">Joining room…</div>
        )}

        {phase === 'waiting' && (
          <WaitingRoom roomCode={roomCode} onCancel={goMenu} />
        )}

        {phase === 'setup-required' && (
          <SetupRequired onBack={goMenu} />
        )}

        {(phase === 'playing' || phase === 'done') && (
          <>
            {error && (
              <p role="alert" className="text-red-400 text-xs text-center mb-2 font-mono">{error}</p>
            )}
            <BoardComponent
              board={board}
              winCells={winCells}
              currentTurn={currentTurn}
              myPlayer={myPlayer}
              isMyTurn={isMyTurn}
              onDrop={drop}
              disabled={phase === 'done'}
              animatingCol={animatingCol}
            />
            {phase === 'done' && (
              <div className="mt-4">
                <GameOver
                  winner={winner}
                  isDraw={isDraw}
                  myPlayer={myPlayer}
                  mode={mode}
                  onRematch={() => void rematch()}
                  onMenu={goMenu}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
