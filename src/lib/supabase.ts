/**
 * Supabase Realtime multiplayer — zero SDK, raw fetch + polling.
 *
 * Architecture:
 *  - Games stored in a `games` table: { id, board, current_turn, status, winner }
 *  - Players poll every 1.5s via REST GET (no WebSocket SDK needed)
 *  - Moves written via REST PATCH
 *  - Room codes are the first 6 chars of the game UUID (uppercase)
 *
 * To use: create a free Supabase project, run the SQL in README, paste URL+anon key.
 * The app falls back to "setup required" UI if env vars are missing.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY ?? '',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY ?? ''}`,
    'Prefer': 'return=representation',
  }
}

export interface GameRow {
  id: string
  room_code: string
  board: number[][]
  current_turn: 1 | 2
  status: 'waiting' | 'playing' | 'done'
  winner: 0 | 1 | 2
  player1_id: string
  player2_id: string | null
  created_at: string
}

function safeUrl(path: string): string {
  const base = (SUPABASE_URL ?? '').replace(/\/$/, '')
  return `${base}/rest/v1/${path}`
}

export async function createGame(playerId: string, board: number[][]): Promise<GameRow> {
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  const res = await fetch(safeUrl('games'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      room_code: roomCode,
      board,
      current_turn: 1,
      status: 'waiting',
      winner: 0,
      player1_id: playerId,
      player2_id: null,
    }),
  })
  if (!res.ok) throw new Error(`Create failed: ${res.status}`)
  const data = await res.json() as GameRow[]
  return data[0]
}

export async function joinGame(roomCode: string, playerId: string): Promise<GameRow> {
  // Find game by room code
  const findRes = await fetch(
    safeUrl(`games?room_code=eq.${encodeURIComponent(roomCode.toUpperCase())}&status=eq.waiting&select=*`),
    { headers: headers() }
  )
  if (!findRes.ok) throw new Error(`Join lookup failed: ${findRes.status}`)
  const rows = await findRes.json() as GameRow[]
  if (!rows.length) throw new Error('Room not found or already started')
  const game = rows[0]

  // Claim P2 slot
  const patchRes = await fetch(
    safeUrl(`games?id=eq.${game.id}`),
    {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ player2_id: playerId, status: 'playing' }),
    }
  )
  if (!patchRes.ok) throw new Error(`Join patch failed: ${patchRes.status}`)
  const patched = await patchRes.json() as GameRow[]
  return patched[0]
}

export async function fetchGame(gameId: string): Promise<GameRow | null> {
  const res = await fetch(
    safeUrl(`games?id=eq.${gameId}&select=*`),
    { headers: headers() }
  )
  if (!res.ok) return null
  const rows = await res.json() as GameRow[]
  return rows[0] ?? null
}

export async function pushMove(
  gameId: string,
  board: number[][],
  nextTurn: 1 | 2,
  status: 'playing' | 'done',
  winner: 0 | 1 | 2,
): Promise<void> {
  const res = await fetch(
    safeUrl(`games?id=eq.${gameId}`),
    {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ board, current_turn: nextTurn, status, winner }),
    }
  )
  if (!res.ok) throw new Error(`Move push failed: ${res.status}`)
}

export async function rematchGame(gameId: string, board: number[][]): Promise<void> {
  const res = await fetch(
    safeUrl(`games?id=eq.${gameId}`),
    {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ board, current_turn: 1, status: 'playing', winner: 0 }),
    }
  )
  if (!res.ok) throw new Error(`Rematch failed: ${res.status}`)
}
