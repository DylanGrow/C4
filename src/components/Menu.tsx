import { useState } from 'react'

interface MenuProps {
  onLocal: () => void
  onCreate: () => void
  onJoin: (code: string) => void
  error: string | null
  loading: boolean
}

export function Menu({ onLocal, onCreate, onJoin, error, loading }: MenuProps) {
  const [joinCode, setJoinCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) return
    onJoin(code)
  }

  return (
    <div className="flex flex-col items-center gap-8 py-8 px-4 w-full max-w-sm mx-auto">
      {/* Logo */}
      <div className="text-center">
        <div className="flex justify-center gap-2 mb-4" aria-hidden="true">
          {[1,2,1,2,1,2,1].map((p, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full shadow-lg"
              style={{
                background: p === 1 ? '#E63946' : '#F4A621',
                boxShadow: p === 1 ? '0 0 12px #E6394688' : '0 0 12px #F4A62188',
                transform: `translateY(${i % 2 === 0 ? '0' : '4px'})`,
              }}
            />
          ))}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white leading-none">
          CONNECT<br/>
          <span style={{ color: '#F4A621' }}>FOUR</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 tracking-wide">Drop. Connect. Win.</p>
      </div>

      {error && (
        <div
          role="alert"
          className="w-full bg-red-950 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg font-mono"
        >
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={onLocal}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-white text-lg tracking-wide transition-all
            bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500
            active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
            focus:ring-offset-slate-900 disabled:opacity-50"
        >
          Play Local (2 Players)
        </button>

        <div className="flex gap-3">
          <button
            onClick={onCreate}
            disabled={loading}
            className="flex-1 py-4 rounded-xl font-bold text-white tracking-wide transition-all
              bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500
              active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2
              focus:ring-offset-slate-900 disabled:opacity-50 text-sm"
          >
            {loading ? '…' : 'Create Room'}
          </button>

          <button
            onClick={() => setShowJoin(v => !v)}
            disabled={loading}
            className="flex-1 py-4 rounded-xl font-bold tracking-wide transition-all
              border border-amber-600 text-amber-400 hover:bg-amber-900/30
              active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2
              focus:ring-offset-slate-900 disabled:opacity-50 text-sm"
          >
            Join Room
          </button>
        </div>

        {showJoin && (
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 8))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="ROOM CODE"
              maxLength={8}
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-slate-800 border border-slate-600 text-white font-mono tracking-[0.2em]
                px-4 py-3 rounded-lg text-center uppercase placeholder-slate-600 text-lg
                focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              aria-label="Room code"
            />
            <button
              onClick={handleJoin}
              disabled={joinCode.trim().length < 4 || loading}
              className="px-5 py-3 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-500
                active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2
                focus:ring-offset-slate-900 disabled:opacity-40 transition-all"
            >
              Go
            </button>
          </div>
        )}
      </div>

      <p className="text-slate-600 text-xs text-center leading-relaxed">
        Remote play via Supabase Realtime.<br/>
        No account needed — just share your room code.
      </p>
    </div>
  )
}
