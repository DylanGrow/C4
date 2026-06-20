import { useCallback, useEffect, useRef, useState } from 'react'
import { emptyBoard, type Board, type Player } from '../lib/constants'
import { checkWin, dropDisc, isDraw } from '../lib/engine'
import { createGame, fetchGame, isConfigured, joinGame, pushMove, rematchGame, type GameRow } from '../lib/supabase'
import { playDrop, playWin, playDraw } from '../lib/sound'

export type Phase = 'menu' | 'creating' | 'waiting' | 'joining' | 'playing' | 'done' | 'setup-required'
export type GameMode = 'local' | 'remote'

export interface GameState {
  board: Board
  currentTurn: Player
  winner: Player | null
  isDraw: boolean
  winCells: [number, number][]
  phase: Phase
  mode: GameMode
  roomCode: string
  myPlayer: Player | null
  error: string | null
  animatingCol: number | null
}

const POLL_INTERVAL = 1500

export function useGame() {
  const [state, setState] = useState<GameState>({
    board: emptyBoard(),
    currentTurn: 1,
    winner: null,
    isDraw: false,
    winCells: [],
    phase: 'menu',
    mode: 'local',
    roomCode: '',
    myPlayer: null,
    error: null,
    animatingCol: null,
  })

  const gameRowRef = useRef<GameRow | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playerIdRef = useRef<string>(
    (() => {
      let id = sessionStorage.getItem('c4pid')
      if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('c4pid', id) }
      return id
    })()
  )

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const applyRemoteRow = useCallback((row: GameRow, myPlayer: Player) => {
    const board = row.board as Board
    const winResult = checkWin(board)
    const draw = !winResult && isDraw(board)
    setState(s => ({
      ...s,
      board,
      currentTurn: row.current_turn,
      winner: winResult?.winner ?? null,
      isDraw: draw,
      winCells: winResult?.cells ?? [],
      phase: row.status === 'done' ? 'done' : row.status === 'playing' ? 'playing' : s.phase,
      myPlayer,
      animatingCol: null,
    }))
    if (row.status === 'done' || row.winner !== 0) stopPolling()
  }, [stopPolling])

  const startPolling = useCallback((gameId: string, myPlayer: Player) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const row = await fetchGame(gameId)
        if (!row) return
        const prev = gameRowRef.current
        if (!prev || JSON.stringify(prev.board) !== JSON.stringify(row.board)
          || prev.status !== row.status || prev.current_turn !== row.current_turn) {
          gameRowRef.current = row
          applyRemoteRow(row, myPlayer)
        }
        if (row.status === 'done') stopPolling()
      } catch { /* network hiccup, keep polling */ }
    }, POLL_INTERVAL)
  }, [stopPolling, applyRemoteRow])

  // Local move
  const dropLocal = useCallback((col: number) => {
    setState(s => {
      if (s.phase !== 'playing' || s.winner || s.isDraw) return s
      const next = dropDisc(s.board, col, s.currentTurn)
      if (!next) return { ...s, error: 'Column full' }
      const winResult = checkWin(next)
      const draw = !winResult && isDraw(next)
      // Play drop sound
      playDrop()
      // Play win/draw sounds if applicable
      if (winResult) playWin()
      else if (draw) playDraw()
      return {
        ...s,
        board: next,
        currentTurn: s.currentTurn === 1 ? 2 : 1,
        winner: winResult?.winner ?? null,
        isDraw: draw,
        winCells: winResult?.cells ?? [],
        phase: winResult || draw ? 'done' : 'playing',
        animatingCol: col,
        error: null,
      }
    })
  }, [])

  // Remote move
  const dropRemote = useCallback(async (col: number) => {
    const s = state
    if (!gameRowRef.current || s.phase !== 'playing' || s.winner || s.isDraw) return
    if (s.myPlayer !== s.currentTurn) { setState(p => ({ ...p, error: "Not your turn" })); return }

    const next = dropDisc(s.board, col, s.currentTurn)
    if (!next) { setState(p => ({ ...p, error: 'Column full' })); return }

    const winResult = checkWin(next)
    const draw = !winResult && isDraw(next)
    const nextTurn: Player = s.currentTurn === 1 ? 2 : 1
    const status = winResult || draw ? 'done' : 'playing'
    const winner: 0 | 1 | 2 = winResult ? winResult.winner : 0

    // Play drop sound
    playDrop()
    // Play win/draw sounds if applicable
    if (winResult) playWin()
    else if (draw) playDraw()

    // Optimistic update
    setState(p => ({
      ...p,
      board: next,
      currentTurn: nextTurn,
      winner: winResult?.winner ?? null,
      isDraw: draw,
      winCells: winResult?.cells ?? [],
      phase: status === 'done' ? 'done' : 'playing',
      animatingCol: col,
      error: null,
    }))

    try {
      await pushMove(gameRowRef.current.id, next as number[][], nextTurn, status, winner)
      if (status === 'done') stopPolling()
    } catch {
      setState(p => ({ ...p, error: 'Move failed — retrying…' }))
    }
  }, [state, stopPolling])

  const drop = useCallback((col: number) => {
    if (state.mode === 'local') dropLocal(col)
    else void dropRemote(col)
  }, [state.mode, dropLocal, dropRemote])

  // Start local game
  const startLocal = useCallback(() => {
    setState(s => ({
      ...s,
      board: emptyBoard(),
      currentTurn: 1,
      winner: null,
      isDraw: false,
      winCells: [],
      phase: 'playing',
      mode: 'local',
      myPlayer: null,
      error: null,
      animatingCol: null,
    }))
  }, [])

  // Create remote room
  const startCreate = useCallback(async () => {
    if (!isConfigured) { setState(s => ({ ...s, phase: 'setup-required' })); return }
    setState(s => ({ ...s, phase: 'creating', error: null }))
    try {
      const board = emptyBoard()
      const row = await createGame(playerIdRef.current, board as number[][])
      gameRowRef.current = row
      setState(s => ({
        ...s,
        board,
        currentTurn: 1,
        winner: null,
        isDraw: false,
        winCells: [],
        phase: 'waiting',
        mode: 'remote',
        roomCode: row.room_code,
        myPlayer: 1,
        error: null,
        animatingCol: null,
      }))
      startPolling(row.id, 1)
    } catch (e) {
      setState(s => ({ ...s, phase: 'menu', error: String(e) }))
    }
  }, [startPolling])

  // Join remote room
  const startJoin = useCallback(async (code: string) => {
    if (!isConfigured) { setState(s => ({ ...s, phase: 'setup-required' })); return }
    setState(s => ({ ...s, phase: 'joining', error: null }))
    try {
      const row = await joinGame(code, playerIdRef.current)
      gameRowRef.current = row
      const board = row.board as Board
      setState(s => ({
        ...s,
        board,
        currentTurn: row.current_turn,
        winner: null,
        isDraw: false,
        winCells: [],
        phase: 'playing',
        mode: 'remote',
        roomCode: row.room_code,
        myPlayer: 2,
        error: null,
        animatingCol: null,
      }))
      startPolling(row.id, 2)
    } catch (e) {
      setState(s => ({ ...s, phase: 'menu', error: String(e) }))
    }
  }, [startPolling])

  // Rematch
  const rematch = useCallback(async () => {
    if (state.mode === 'local') { startLocal(); return }
    if (!gameRowRef.current) return
    const board = emptyBoard()
    try {
      await rematchGame(gameRowRef.current.id, board as number[][])
      setState(s => ({
        ...s,
        board,
        currentTurn: 1,
        winner: null,
        isDraw: false,
        winCells: [],
        phase: 'playing',
        animatingCol: null,
        error: null,
      }))
      startPolling(gameRowRef.current.id, state.myPlayer ?? 1)
    } catch (e) {
      setState(s => ({ ...s, error: String(e) }))
    }
  }, [state.mode, state.myPlayer, startLocal, startPolling])

  const goMenu = useCallback(() => {
    stopPolling()
    gameRowRef.current = null
    setState({
      board: emptyBoard(),
      currentTurn: 1,
      winner: null,
      isDraw: false,
      winCells: [],
      phase: 'menu',
      mode: 'local',
      roomCode: '',
      myPlayer: null,
      error: null,
      animatingCol: null,
    })
  }, [stopPolling])

  useEffect(() => () => stopPolling(), [stopPolling])

  return { state, drop, startLocal, startCreate, startJoin, rematch, goMenu }
}
