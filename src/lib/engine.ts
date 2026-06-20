import { Board, Cell, COLS, EMPTY, ROWS, type Player } from './constants'

export function dropDisc(board: Board, col: number, player: Player): Board | null {
  // Find lowest empty row in column
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === EMPTY) {
      const next = board.map(r => [...r] as Cell[])
      next[row][col] = player
      return next
    }
  }
  return null // column full
}

export function canDrop(board: Board, col: number): boolean {
  return board[0][col] === EMPTY
}

export interface WinResult {
  winner: Player
  cells: [number, number][]
}

export function checkWin(board: Board): WinResult | null {
  const directions: [number, number][] = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal ↘
    [1, -1], // diagonal ↙
  ]

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col]
      if (cell === EMPTY) continue
      for (const [dr, dc] of directions) {
        const cells: [number, number][] = [[row, col]]
        for (let i = 1; i < 4; i++) {
          const r = row + dr * i
          const c = col + dc * i
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== cell) break
          cells.push([r, c])
        }
        if (cells.length === 4) {
          return { winner: cell as Player, cells }
        }
      }
    }
  }
  return null
}

export function isDraw(board: Board): boolean {
  return board[0].every(cell => cell !== EMPTY)
}
