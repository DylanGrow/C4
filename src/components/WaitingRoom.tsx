interface WaitingRoomProps {
  roomCode: string
  onCancel: () => void
}

export function WaitingRoom({ roomCode, onCancel }: WaitingRoomProps) {
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
    } catch { /* clipboard not available */ }
  }

  return (
    <div className="flex flex-col items-center gap-8 py-12 px-4 w-full max-w-sm mx-auto text-center">
      <div>
        <p className="text-slate-400 text-sm uppercase tracking-widest mb-3 font-mono">Your room code</p>
        <button
          onClick={copyCode}
          className="text-5xl font-black font-mono tracking-[0.25em] text-white hover:text-amber-400
            transition-colors focus:outline-none focus:underline"
          aria-label={`Room code: ${roomCode}. Click to copy.`}
          title="Click to copy"
        >
          {roomCode}
        </button>
        <p className="text-slate-500 text-xs mt-2">tap to copy</p>
      </div>

      {/* Animated waiting indicator */}
      <div className="flex gap-3" aria-label="Waiting for opponent">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-3 h-3 rounded-full"
            style={{
              background: '#1B4FD8',
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <div>
        <p className="text-slate-300 text-lg font-medium">Waiting for opponent…</p>
        <p className="text-slate-500 text-sm mt-1">
          Share the code above. They'll join and you'll start automatically.
        </p>
      </div>

      <button
        onClick={onCancel}
        className="text-slate-500 hover:text-slate-300 text-sm underline underline-offset-4
          focus:outline-none focus:text-slate-300 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
